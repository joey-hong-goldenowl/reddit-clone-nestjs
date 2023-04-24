import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UploadApiResponse } from 'cloudinary';
import { AssetService } from 'src/asset/asset.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { User } from 'src/user/entities/user.entity';
import { ILike, Repository } from 'typeorm';
import { CreateCommunityRequestDto } from './dto/create-community.dto';
import { UpdateCommunityRequestDto } from './dto/update-community.dto';
import { Community } from './entities/community.entity';
import { CommunityMember, MemberRole } from './entities/community_member.entity';
import { Post } from 'src/post/entities/post.entity';
import { PostInteractionType } from 'src/post/entities/post-interaction.entity';
import { POST_FILTER } from 'src/helpers/enum/filter.enum';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(Community)
    private communityRepository: Repository<Community>,
    @InjectRepository(CommunityMember)
    private communityMemberRepository: Repository<CommunityMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly assetService: AssetService
  ) {}

  async create(user: User, createCommunityRequestDto: CreateCommunityRequestDto) {
    const { name } = createCommunityRequestDto;
    if (name.trim().split(' ').length > 1) {
      throw new BadRequestException(`Community's name must not have space`);
    }
    const community = await this.communityRepository.findOneBy({ name });
    if (community) {
      throw new BadRequestException(`Community's name is already in use`);
    }
    const newCommunity = this.communityRepository.create({
      name,
      owner: user
    });
    const addedCommunity = await this.communityRepository.save(newCommunity);
    const ownerMember = this.communityMemberRepository.create({
      community_id: addedCommunity.id,
      user_id: user.id,
      role: MemberRole.OWNER
    });
    await this.communityMemberRepository.save(ownerMember);
    return addedCommunity;
  }

  async findAll(page: number, limit: number, user?: User) {
    if (page < 1) page = 1;
    const skip = (page - 1) * limit;
    const qb = this.communityRepository
      .createQueryBuilder('community')
      .leftJoinAndSelect('community.avatar', 'avatar')
      .leftJoinAndSelect('community.banner', 'banner')
      .leftJoinAndSelect('community.owner', 'owner')
      .leftJoinAndSelect('community.members', 'members')
      .loadRelationCountAndMap('community.member_count', 'community.members')
      .take(limit)
      .skip(skip);

    const communityList = await qb.getMany();
    const communityListResponse = communityList.map(community => {
      const userJoinedCommunity = community.members?.findIndex(member => member.user_id === user?.id) !== -1;
      const isOwnerOfCommunity = community.owner.id === user?.id;
      delete community.members;
      return {
        ...community,
        joined: userJoinedCommunity,
        isOwner: isOwnerOfCommunity
      };
    });
    const total = await qb.getCount();
    return {
      list: communityListResponse,
      total,
      count: communityListResponse.length
    };
  }

  async findOne(id: number) {
    const community = await this.findOneById(id);
    if (community) {
      return community;
    }
    throw new NotFoundException('Community not found');
  }

  async update(id: number, updateCommunityRequestDto: UpdateCommunityRequestDto, user: User, avatar?: Express.Multer.File, banner?: Express.Multer.File) {
    delete updateCommunityRequestDto.avatar;
    delete updateCommunityRequestDto.banner;

    const { delete_avatar, delete_banner } = updateCommunityRequestDto;
    const community = await this.findOneById(id);
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    if (delete_avatar && community.avatar) {
      const assetId = community.avatar.id;
      await this.cloudinaryService.deleteImage({
        image_url: community.avatar.url,
        user_id: user.id
      });
      await this.removeAvatar(community.id);
      await this.assetService.delete(assetId);
    } else if (avatar) {
      const uploadedAvatar = await this.cloudinaryService.uploadImage({
        user_id: user.id,
        file: avatar
      });
      const { secure_url } = uploadedAvatar as UploadApiResponse;

      if (community.avatar) {
        await this.cloudinaryService.deleteImage({
          image_url: community.avatar.url,
          user_id: user.id
        });
        await this.assetService.update(community.avatar.id, {
          url: secure_url,
          type: 'image'
        });
      } else {
        const avatarAsset = await this.assetService.create({
          url: secure_url,
          type: 'image'
        });
        updateCommunityRequestDto.avatar = avatarAsset;
      }
    }

    if (delete_banner && community.banner) {
      const assetId = community.banner.id;
      await this.cloudinaryService.deleteImage({
        image_url: community.banner.url,
        user_id: user.id
      });
      await this.removeBanner(community.id);
      await this.assetService.delete(assetId);
    } else if (banner) {
      const uploadedBanner = await this.cloudinaryService.uploadImage({
        user_id: user.id,
        file: banner
      });
      const { secure_url } = uploadedBanner as UploadApiResponse;

      if (community.banner) {
        await this.cloudinaryService.deleteImage({
          image_url: community.banner.url,
          user_id: user.id
        });
        await this.assetService.update(community.banner.id, {
          url: secure_url,
          type: 'image'
        });
      } else {
        const bannerAsset = await this.assetService.create({
          url: secure_url,
          type: 'image'
        });
        updateCommunityRequestDto.banner = bannerAsset;
      }
    }

    await this.communityRepository.update(id, {
      description: updateCommunityRequestDto.description,
      title: updateCommunityRequestDto.title,
      avatar: updateCommunityRequestDto.avatar,
      banner: updateCommunityRequestDto.banner
    });
    return this.findOneById(id);
  }

  async remove(id: number, user: User) {
    const community = await this.findOneById(id);
    if (community) {
      const avatarAssetId = community.avatar?.id;
      const avatarUrl = community.avatar?.url;
      const bannerAssetId = community.banner?.id;
      const bannerUrl = community.banner?.url;
      await this.communityRepository.delete({ id });

      const promiseArr = [];
      if (avatarAssetId) {
        promiseArr.push(this.assetService.delete(avatarAssetId));
        promiseArr.push(
          this.cloudinaryService.deleteImage({
            image_url: avatarUrl,
            user_id: user.id
          })
        );
      }
      if (bannerAssetId) {
        promiseArr.push(this.assetService.delete(bannerAssetId));
        promiseArr.push(
          this.cloudinaryService.deleteImage({
            image_url: bannerUrl,
            user_id: user.id
          })
        );
      }
      if (promiseArr.length > 0) {
        await Promise.all(promiseArr);
      }
      return { success: true };
    }
    throw new NotFoundException('Community not found');
  }

  findOneById(id: number) {
    return this.communityRepository.findOneBy({ id });
  }

  findAllOwned(userId: number) {
    return this.communityRepository.findBy({ owner: { id: userId } });
  }

  async findAllJoined(userId: number) {
    const communityList = await this.communityRepository
      .createQueryBuilder('community')
      .leftJoinAndSelect('community.avatar', 'avatar')
      .leftJoinAndSelect('community.members', 'members')
      .getMany();

    return communityList
      .filter(community => community.members?.findIndex(member => member.user_id === userId) !== -1)
      .map(community => {
        delete community.members;
        return community;
      });
  }

  async isOwnerOfCommunity(user: User, communityId: number) {
    const community = await this.findOneById(communityId);
    if (!community) {
      throw new NotFoundException('Community not found');
    }
    return community.owner.id === user.id;
  }

  async isAuthorized(user: User, communityId: number, roles: MemberRole[]) {
    const community = await this.findOneById(communityId);
    if (!community) {
      throw new NotFoundException('Community not found');
    }
    const { role } = await this.findMember(user, communityId);
    return roles.includes(role);
  }

  async removeAvatar(communityId: number) {
    await this.communityRepository.update(communityId, {
      avatar: null
    });
  }

  async removeBanner(communityId: number) {
    await this.communityRepository.update(communityId, {
      banner: null
    });
  }

  async joinCommunity(communityId: number, user: User) {
    const communityMember = await this.communityMemberRepository.findOneBy({
      community_id: communityId,
      user: {
        id: user.id
      }
    });
    if (communityMember) {
      throw new BadRequestException('User is already in community');
    }
    const newCommunityMember = this.communityMemberRepository.create({
      community_id: communityId,
      user_id: user.id
    });
    return this.communityMemberRepository.save(newCommunityMember);
  }

  async getMemberList(communityId: number, page: number, limit: number) {
    if (page < 1) page = 1;
    const community = await this.communityRepository.findOneBy({ id: communityId });
    if (!community) {
      throw new NotFoundException(`Community doesn't exist`);
    }
    const skip = (page - 1) * limit;
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.member_info', 'member_info')
      .leftJoinAndSelect('user.avatar', 'avatar')
      .where('member_info.community_id = :communityId', { communityId })
      .select(['user.id', 'user.username', 'user.email'])
      .addSelect(['member_info.role'])
      .addSelect(['avatar.url', 'avatar.type'])
      .take(limit)
      .skip(skip);

    const list = await qb.getMany();
    const total = await qb.getCount();
    return {
      list,
      total,
      count: list.length
    };
  }

  async findMember(user: User, communityId: number) {
    const member = await this.communityMemberRepository.findOneBy({
      community_id: communityId,
      user: {
        id: user.id
      }
    });
    if (!member) {
      throw new NotFoundException('User is not in this community');
    }
    return member;
  }

  async getPostList(communityId: number, filter: POST_FILTER, page: number, limit: number, user?: User) {
    if (page < 1) page = 1;
    const community = await this.communityRepository.findOneBy({ id: communityId });
    if (!community) {
      throw new NotFoundException(`Community doesn't exist`);
    }
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
        WHERE community_id = ${communityId}
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
               ${
                 filter === POST_FILTER.top
                   ? `, COUNT(p_i.*) filter (where p_i.type = '${PostInteractionType.UPVOTE}') - COUNT(p_i.*) filter (where p_i.type = '${PostInteractionType.DOWNVOTE}') as interaction_point`
                   : ''
               }
        FROM post_interactions p_i
        GROUP  BY p_i.post_id
      ) p_i
      ON p_i.post_id = p.id
      ORDER BY ${filter === POST_FILTER.top ? 'p_i.interaction_point' : 'p.created_at'} DESC NULLS LAST
      LIMIT ${limit}
      OFFSET ${skip}
    `);
    const responseList = list.map(post => {
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
        ]
      };
    });
    const total = await this.postRepository.createQueryBuilder('post').where('post.community_id = :communityId', { communityId }).getCount();
    return {
      list: responseList,
      total,
      count: responseList.length
    };
  }

  async findOneByIdWithMemberCount(communityId: number, user?: User) {
    const community = await this.communityRepository.findOneBy({ id: communityId });
    if (!community) {
      throw new NotFoundException(`Community doesn't exist`);
    }

    const responseCommunity = await this.communityRepository
      .createQueryBuilder('community')
      .leftJoinAndSelect('community.avatar', 'avatar')
      .leftJoinAndSelect('community.banner', 'banner')
      .leftJoinAndSelect('community.owner', 'owner')
      .leftJoinAndSelect('community.members', 'members')
      .loadRelationCountAndMap('community.member_count', 'community.members')
      .where('community.id = :communityId', { communityId })
      .getOne();

    const userJoinedCommunity = responseCommunity.members?.findIndex(member => member.user_id === user?.id) !== -1;
    const isOwnerOfCommunity = responseCommunity.owner.id === user?.id;
    delete responseCommunity.members;
    return {
      ...responseCommunity,
      joined: userJoinedCommunity,
      isOwner: isOwnerOfCommunity
    };
  }

  async getRecommendations(searchKey: string) {
    return this.communityRepository.find({
      where: {
        name: ILike(`%${searchKey}%`)
      },
      relations: ['avatar'],
      take: 5
    });
  }

  async search(searchKey: string, page: number, limit: number, user?: User) {
    if (page < 1) page = 1;
    let joinedCommunity = [];
    if (user) {
      joinedCommunity = await this.findAllJoined(user?.id);
      joinedCommunity = joinedCommunity.map(community => community.id);
    }
    const skip = (page - 1) * limit;
    const qb = this.communityRepository
      .createQueryBuilder('community')
      .leftJoinAndSelect('community.avatar', 'avatar')
      .where('community.name ILIKE :name', { name: `%${searchKey}%` })
      .take(limit)
      .skip(skip);

    const communityList = await qb.getMany();
    const communityListResponse = communityList.map(community => {
      return {
        ...community,
        joined: joinedCommunity.includes(community.id)
      };
    });
    const total = await qb.getCount();

    return {
      list: communityListResponse,
      total,
      count: communityListResponse.length
    };
  }
}
