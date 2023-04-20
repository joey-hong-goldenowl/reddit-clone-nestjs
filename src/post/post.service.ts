import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePostRequestDto } from './dto/create-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post, PostType } from './entities/post.entity';
import { DeepPartial, Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { AssetService } from 'src/asset/asset.service';
import { CommunityService } from 'src/community/community.service';
import { UploadApiResponse } from 'cloudinary';
import { PostAsset } from './entities/post-asset.entity';
import { Asset } from 'src/asset/entities/asset.entity';
import { InteractPostRequestDto } from './dto/interact-post.dto';
import { PostInteraction, PostInteractionType } from './entities/post-interaction.entity';
import { Comment } from 'src/comment/entities/comment.entity';
import { CommentInteractionType } from 'src/comment/entities/comment-interaction.entity';
import { format, sub } from 'date-fns';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(PostAsset)
    private postAssetRepository: Repository<PostAsset>,
    @InjectRepository(PostInteraction)
    private postInteractionRepository: Repository<PostInteraction>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly assetService: AssetService,
    private readonly communityService: CommunityService
  ) {}

  async create(createPostRequestDto: CreatePostRequestDto, user: User, assets: Express.Multer.File[]) {
    const { community_id, type } = createPostRequestDto;
    const community = await this.communityService.findOneById(community_id);
    if (!community) {
      throw new NotFoundException(`Community doesn't exist`);
    }
    try {
      let addedAssets: Asset[] = null;
      switch (type) {
        case PostType.IMAGE: {
          const promiseUploadImages = assets.map(file =>
            this.cloudinaryService.uploadImage({
              user_id: user.id,
              file
            })
          );
          const uploadedAssets = await Promise.all(promiseUploadImages);
          const createAssetRequestDtoArray = (uploadedAssets as UploadApiResponse[]).map(asset => ({
            url: asset.secure_url,
            type: 'image'
          }));
          addedAssets = await this.assetService.createMultiple(createAssetRequestDtoArray);
          break;
        }
        case PostType.VIDEO:
          if (assets.length > 0) {
            const uploadedVideo = await this.cloudinaryService.uploadVideo({
              user_id: user.id,
              file: assets[0]
            });
            const { secure_url } = uploadedVideo as UploadApiResponse;
            const videoAsset = await this.assetService.create({
              url: secure_url,
              type: 'video'
            });
            addedAssets = [videoAsset];
          }
          break;
        default:
      }
      const newPost = this.postRepository.create({
        title: createPostRequestDto.title,
        body_text: createPostRequestDto.body_text,
        community_id: Number(createPostRequestDto.community_id),
        type: createPostRequestDto.type,
        owner: user
      });
      const addedPost = await this.postRepository.save(newPost);
      const postAssets: DeepPartial<PostAsset>[] | undefined = addedAssets?.map(asset => ({
        post_id: addedPost.id,
        asset_id: asset.id
      }));
      if (postAssets && postAssets.length > 0) {
        const postAssetRecords = this.postAssetRepository.create(postAssets);
        await this.postAssetRepository.save(postAssetRecords);
      }
      return this.findOne(addedPost.id, user);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async findOne(id: number, user?: User) {
    const foundPost = await this.postRepository.findOneBy({ id });
    if (!foundPost) {
      throw new NotFoundException(`Post doesn't exist`);
    }

    const post = await this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.assets', 'assets')
      .leftJoinAndSelect('post.owner', 'owner')
      .leftJoinAndSelect('assets.details', 'details')
      .leftJoinAndSelect('post.interactions', 'interactions')
      .loadRelationCountAndMap('post.comment_count', 'post.comments')
      .where('post.id = :postId', { postId: id })
      .getOne();

    const upvote_interactions = post.interactions.filter(interaction => interaction.type === PostInteractionType.UPVOTE);
    const downvote_interactions = post.interactions.filter(interaction => interaction.type === PostInteractionType.DOWNVOTE);

    const upvote_count = upvote_interactions.length;
    const downvote_count = downvote_interactions.length;
    const is_upvoted = upvote_interactions.findIndex(interaction => interaction.user_id === user?.id) !== -1;
    const is_downvoted = downvote_interactions.findIndex(interaction => interaction.user_id === user?.id) !== -1;

    return {
      ...post,
      community_id: Number(post.community_id),
      is_upvoted,
      is_downvoted,
      interactions: [
        {
          type: PostInteractionType.UPVOTE,
          count: upvote_count
        },
        {
          type: PostInteractionType.DOWNVOTE,
          count: downvote_count
        }
      ]
    };
  }

  async remove(id: number, user: User) {
    const post = await this.postRepository.findOne({
      where: {
        id,
        owner: {
          id: user.id
        }
      },
      relations: ['assets']
    });
    if (!post) {
      throw new NotFoundException(`Post doesn't exist`);
    }
    try {
      const { assets = [], type } = post;
      await this.postRepository.delete({ id });

      switch (type) {
        case PostType.IMAGE: {
          const promiseDeleteImages = assets.map(asset =>
            this.cloudinaryService.deleteImage({
              image_url: asset.details.url,
              user_id: user.id
            })
          );
          await Promise.all(promiseDeleteImages);
          break;
        }
        case PostType.VIDEO: {
          const promiseDeleteVideos = assets.map(asset =>
            this.cloudinaryService.deleteVideo({
              video_url: asset.details.url,
              user_id: user.id
            })
          );
          await Promise.all(promiseDeleteVideos);
          break;
        }
        default:
      }
      await this.assetService.deleteMultiple(assets.map(asset => asset.asset_id));
      return { success: true };
    } catch (error) {
      console.log('error', error);
      throw new InternalServerErrorException();
    }
  }

  async interactPost(postId: number, user: User, interactPostRequestDto: InteractPostRequestDto) {
    const { remove_interaction = false } = interactPostRequestDto;
    const post = await this.postRepository.findOneBy({ id: postId });
    if (!post) {
      throw new NotFoundException(`Post doesn't exist`);
    }
    const interaction = await this.postInteractionRepository.findOneBy({ post_id: postId, user_id: user.id });
    if (interaction) {
      if (remove_interaction) {
        await this.postInteractionRepository.delete({
          post_id: postId,
          user_id: user.id
        });
        return { success: true };
      }
      // update
      await this.postInteractionRepository.update(
        {
          post_id: postId,
          user_id: user.id
        },
        {
          type: interactPostRequestDto.type
        }
      );
      return this.postInteractionRepository.findOneBy({ post_id: postId, user_id: user.id });
    }

    if (remove_interaction) {
      throw new NotFoundException();
    }
    const newInteraction = this.postInteractionRepository.create({
      post_id: postId,
      user_id: user.id,
      type: interactPostRequestDto.type
    });
    return this.postInteractionRepository.save(newInteraction);
  }

  async getComments(postId: number, page: number, limit: number, user?: User) {
    if (page < 1) page = 1;

    await this.findOne(postId);

    const skip = (page - 1) * limit;
    const qb = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.owner', 'owner')
      .leftJoinAndSelect('comment.interactions', 'interactions')
      .where('comment.post_id = :postId', { postId })
      .take(limit)
      .skip(skip);

    const list = await qb.getMany();
    const responseList = list.map(comment => {
      const upvote_interactions = comment.interactions.filter(interaction => interaction.type === CommentInteractionType.UPVOTE);
      const downvote_interactions = comment.interactions.filter(interaction => interaction.type === CommentInteractionType.DOWNVOTE);

      const upvote_count = upvote_interactions.length;
      const downvote_count = downvote_interactions.length;
      const is_upvoted = upvote_interactions.findIndex(interaction => interaction.user_id === user?.id) !== -1;
      const is_downvoted = downvote_interactions.findIndex(interaction => interaction.user_id === user?.id) !== -1;
      return {
        ...comment,
        is_upvoted,
        is_downvoted,
        interactions: [
          {
            type: CommentInteractionType.UPVOTE,
            count: upvote_count
          },
          {
            type: CommentInteractionType.DOWNVOTE,
            count: downvote_count
          }
        ]
      };
    });
    const total = await qb.getCount();

    return {
      list: responseList,
      total,
      count: responseList.length
    };
  }

  async getNewsFeed(page: number, limit: number, user?: User) {
    let joinedCommunity = [];
    if (user) {
      joinedCommunity = await this.communityService.findAllJoined(user?.id);
      joinedCommunity = joinedCommunity.map(community => community.id);
    }
    if (page < 1) page = 1;
    const skip = (page - 1) * limit;
    const list = await this.postRepository.query(`
      SELECT p.*,
             to_json(u.*) as owner,
             to_json(c.*) as community,
             p_a.asset_array as assets,
             p_i.interaction_array as interactions
      FROM (
        SELECT *
        FROM posts
        ${user ? `WHERE community_id in (${joinedCommunity.join(', ')})` : ''}
      ) p
      LEFT JOIN (
        SELECT u.id,
               u.username,
               u.email,
               to_json(u_a.*) as avatar
        FROM users u
        LEFT JOIN assets u_a
        ON u.avatar_asset_id = u_a.id
      ) u
      ON p.owner_id = u.id
      LEFT JOIN (
        SELECT c.id,
               c.name,
               to_json(c_a.*) as avatar
        FROM communities c
        LEFT JOIN assets c_a
        ON c.avatar_asset_id = c_a.id
      ) c
      ON p.community_id = c.id
      LEFT JOIN (
        SELECT p_a.post_id as post_id,
               jsonb_agg(to_jsonb(a)) as asset_array
        FROM post_assets p_a
        LEFT JOIN assets a
        ON p_a.asset_id = a.id
        GROUP  BY p_a.post_id
      ) p_a
      ON p_a.post_id = p.id
      LEFT JOIN (
        SELECT p_i.post_id as post_id,
               jsonb_agg(to_jsonb(p_i)) as interaction_array
        FROM post_interactions p_i
        GROUP  BY p_i.post_id
      ) p_i
      ON p_i.post_id = p.id
      ORDER BY p.created_at DESC NULLS LAST
      LIMIT ${limit}
      OFFSET ${skip}
    `);
    const listResponse = list.map(post => {
      const upvote_interactions = post.interactions?.filter(interaction => interaction.type === PostInteractionType.UPVOTE) ?? [];
      const downvote_interactions = post.interactions?.filter(interaction => interaction.type === PostInteractionType.DOWNVOTE) ?? [];

      const upvote_count = upvote_interactions.length;
      const downvote_count = downvote_interactions.length;
      const is_upvoted = upvote_interactions.findIndex(interaction => interaction.user_id === user?.id) !== -1;
      const is_downvoted = downvote_interactions.findIndex(interaction => interaction.user_id === user?.id) !== -1;
      return {
        ...post,
        community_id: Number(post.community_id),
        is_upvoted,
        is_downvoted,
        interactions: [
          {
            type: PostInteractionType.UPVOTE,
            count: upvote_count
          },
          {
            type: PostInteractionType.DOWNVOTE,
            count: downvote_count
          }
        ],
        joinedCommunity: joinedCommunity.includes(post.community_id)
      };
    });
    const qb = this.postRepository.createQueryBuilder('post');
    if (user) {
      qb.where('post.community_id IN (:...joinedCommunity)', { joinedCommunity });
    }
    const total = await qb.getCount();
    return {
      list: listResponse,
      total,
      count: listResponse.length
    };
  }

  async getPopularNewsFeed(page: number, limit: number, user?: User) {
    let joinedCommunity = [];
    if (user) {
      joinedCommunity = await this.communityService.findAllJoined(user?.id);
      joinedCommunity = joinedCommunity.map(community => community.id);
    }
    if (page < 1) page = 1;
    const skip = (page - 1) * limit;
    const list = await this.postRepository.query(`
      SELECT p.*,
             to_json(u.*) as owner,
             to_json(c.*) as community,
             p_a.asset_array as assets,
             p_i.interaction_array as interactions
      FROM (
        SELECT *
        FROM posts
        WHERE created_at > '${format(sub(new Date(), { days: 7 }), 'yyyy-MM-dd hh:mm:ss')}'
      ) p
      LEFT JOIN (
        SELECT u.id,
               u.username,
               u.email,
               to_json(u_a.*) as avatar
        FROM users u
        LEFT JOIN assets u_a
        ON u.avatar_asset_id = u_a.id
      ) u
      ON p.owner_id = u.id
      LEFT JOIN (
        SELECT c.id,
               c.name,
               to_json(c_a.*) as avatar
        FROM communities c
        LEFT JOIN assets c_a
        ON c.avatar_asset_id = c_a.id
      ) c
      ON p.community_id = c.id
      LEFT JOIN (
        SELECT p_a.post_id as post_id,
               jsonb_agg(to_jsonb(a)) as asset_array
        FROM post_assets p_a
        LEFT JOIN assets a
        ON p_a.asset_id = a.id
        GROUP  BY p_a.post_id
      ) p_a
      ON p_a.post_id = p.id
      LEFT JOIN (
        SELECT p_i.post_id as post_id,
               jsonb_agg(to_jsonb(p_i)) as interaction_array,
               COUNT(p_i.*) filter (where p_i.type = '${PostInteractionType.UPVOTE}') AS upvote_count
        FROM post_interactions p_i
        GROUP  BY p_i.post_id
      ) p_i
      ON p_i.post_id = p.id
      ORDER BY p_i.upvote_Count DESC NULLS LAST
      LIMIT ${limit}
      OFFSET ${skip}
    `);

    const listResponse = list.map(post => {
      const upvote_interactions = post.interactions?.filter(interaction => interaction.type === PostInteractionType.UPVOTE) ?? [];
      const downvote_interactions = post.interactions?.filter(interaction => interaction.type === PostInteractionType.DOWNVOTE) ?? [];

      const upvote_count = upvote_interactions.length;
      const downvote_count = downvote_interactions.length;
      const is_upvoted = upvote_interactions.findIndex(interaction => interaction.user_id === user?.id) !== -1;
      const is_downvoted = downvote_interactions.findIndex(interaction => interaction.user_id === user?.id) !== -1;

      return {
        ...post,
        community_id: Number(post.community_id),
        is_upvoted,
        is_downvoted,
        interactions: [
          {
            type: PostInteractionType.UPVOTE,
            count: upvote_count
          },
          {
            type: PostInteractionType.DOWNVOTE,
            count: downvote_count
          }
        ],
        joinedCommunity: joinedCommunity.includes(post.community_id)
      };
    });

    const total = await this.postRepository
      .createQueryBuilder('post')
      .where('post.created_at > :date', {
        date: format(
          sub(new Date(), {
            days: 7
          }),
          'yyyy-MM-dd hh:mm:ss'
        )
      })
      .getCount();
    return {
      list: listResponse,
      total,
      count: listResponse.length
    };
  }

  async search(searchKey: string, page: number, limit: number, user?: User) {
    if (page < 1) page = 1;
    const skip = (page - 1) * limit;
    const qb = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.assets', 'assets')
      .leftJoinAndSelect('post.owner', 'owner')
      .leftJoinAndSelect('assets.details', 'details')
      .leftJoinAndSelect('post.interactions', 'interactions')
      .leftJoinAndSelect('post.community', 'community')
      .where('post.title ILIKE :name', { name: `%${searchKey}%` })
      .orderBy('post.created_at', 'DESC');

    qb.take(limit).skip(skip);

    const list = await qb.getMany();
    const listResponse = list.map(post => {
      const upvote_interactions = post.interactions.filter(interaction => interaction.type === PostInteractionType.UPVOTE);
      const downvote_interactions = post.interactions.filter(interaction => interaction.type === PostInteractionType.DOWNVOTE);

      const upvote_count = upvote_interactions.length;
      const downvote_count = downvote_interactions.length;
      const is_upvoted = upvote_interactions.findIndex(interaction => interaction.user_id === user?.id) !== -1;
      const is_downvoted = downvote_interactions.findIndex(interaction => interaction.user_id === user?.id) !== -1;
      return {
        ...post,
        community_id: Number(post.community_id),
        is_upvoted,
        is_downvoted,
        interactions: [
          {
            type: PostInteractionType.UPVOTE,
            count: upvote_count
          },
          {
            type: PostInteractionType.DOWNVOTE,
            count: downvote_count
          }
        ]
      };
    });
    const total = await qb.getCount();
    return {
      list: listResponse,
      total,
      count: listResponse.length
    };
  }
}
