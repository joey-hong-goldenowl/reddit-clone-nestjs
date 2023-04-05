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
import { CommunityMember } from './entities/community_member.entity';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(Community)
    private communityRepository: Repository<Community>,
    @InjectRepository(CommunityMember)
    private communityMemberRepository: Repository<CommunityMember>,
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
    return this.communityRepository.save(newCommunity);
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
      const avatarAssetId = community.avatar.id;
      const avatarUrl = community.avatar.url;
      const bannerAssetId = community.banner.id;
      const bannerUrl = community.banner.url;
      await Promise.all([
        this.communityRepository.delete({ id }),
        this.assetService.delete(avatarAssetId),
        this.assetService.delete(bannerAssetId),
        this.cloudinaryService.deleteImage({
          image_url: avatarUrl,
          user_id: user.id
        }),
        this.cloudinaryService.deleteImage({
          image_url: bannerUrl,
          user_id: user.id
        })
      ]);
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
      console.log('??');
      throw new BadRequestException('User is already in community');
    }
    const newCommunityMember = this.communityMemberRepository.create({
      community_id: communityId,
      user_id: user.id
    });
    return this.communityMemberRepository.save(newCommunityMember);
  }
}
