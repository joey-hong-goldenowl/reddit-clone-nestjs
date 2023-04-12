import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(PostAsset)
    private postAssetRepository: Repository<PostAsset>,
    @InjectRepository(PostInteraction)
    private postInteractionRepository: Repository<PostInteraction>,
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
      where: { id },
      relations: ['assets']
    });
    if (!post) {
      throw new NotFoundException(`Post doesn't exist`);
    }
    if (post.owner.id !== user.id) {
      throw new ForbiddenException();
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
    console.log(interactPostRequestDto);
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
}
