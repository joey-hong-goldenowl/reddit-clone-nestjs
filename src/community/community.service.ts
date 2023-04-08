import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UploadApiResponse } from 'cloudinary';
import { AssetService } from 'src/asset/asset.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateCommunityRequestDto } from './dto/create-community.dto';
import { UpdateCommunityRequestDto } from './dto/update-community.dto';
import { Community } from './entities/community.entity';
import { CommunityMember, MemberRole } from './entities/community_member.entity';
import { TABLE } from 'src/helpers/enum/table.enum';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(Community)
    private communityRepository: Repository<Community>,
    @InjectRepository(CommunityMember)
    private communityMemberRepository: Repository<CommunityMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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

  findAll() {
    return this.communityRepository.find();
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
      user_id: user.id
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

  async getMemberList(communityId: number) {
    // TODO: add pagination
    const community = await this.communityRepository.findOneBy({ id: communityId });
    if (!community) {
      throw new NotFoundException(`Community doesn't exist`);
    }
    // return (
    //   this.userRepository
    //     .createQueryBuilder()
    //     .from(TABLE.USERS, 'user')
    //     .innerJoin(TABLE.COMMUNITY_MEMBERS, 'community_member', 'community_member.user_id = user.id')
    //     // .where('community_member.community_id = :communityId', { communityId })
    //     // .leftJoinAndSelect('user.avatar', 'asset')
    //     .select('user.id', 'id')
    //     .getMany()
    // );
    // return this.communityMemberRepository.query(
    //   `SELECT user.* FROM ${TABLE.COMMUNITY_MEMBERS} c_u INNER JOIN ${TABLE.USERS} user ON c_u.user_id = user.id WHERE c_u.community_id = ${communityId}`
    // );
    return this.communityMemberRepository.query(`
      SELECT 
        ${TABLE.USERS}.id,
        ${TABLE.USERS}.username,
        ${TABLE.USERS}.email,
        ${TABLE.COMMUNITY_MEMBERS}.role as role,
        ${TABLE.ASSETS}.url as avatar_url
      FROM ${TABLE.COMMUNITY_MEMBERS}, ${TABLE.USERS}, ${TABLE.ASSETS}
      WHERE ${TABLE.COMMUNITY_MEMBERS}.user_id = ${TABLE.USERS}.id
        AND ${TABLE.COMMUNITY_MEMBERS}.community_id = ${communityId}
        AND ${TABLE.USERS}.avatar_asset_id = ${TABLE.ASSETS}.id
    `);
  }

  async findMember(user: User, communityId: number) {
    const member = await this.communityMemberRepository.findOneBy({
      community_id: communityId,
      user_id: user.id
    });
    if (!member) {
      throw new NotFoundException('User is not in this community');
    }
    return member;
  }
}
