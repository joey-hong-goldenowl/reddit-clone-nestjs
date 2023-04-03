import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UploadApiResponse } from 'cloudinary';
import { AssetService } from 'src/asset/asset.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { Community } from './entities/community.entity';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(Community)
    private communityRepository: Repository<Community>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly assetService: AssetService
  ) {}

  async create(user: User, createCommunityDto: CreateCommunityDto) {
    const { name } = createCommunityDto;
    if (name.trim().split(' ').length > 1) {
      throw new BadRequestException(`Community's name must not have space`);
    }
    const community = await this.communityRepository.findOneBy({ name });
    if (community) {
      throw new BadRequestException(`Community's name is already in use`);
    }
    const newCommunity = await this.communityRepository.create({
      name,
      owner: user
    });
    return this.communityRepository.save(newCommunity);
  }

  findAll() {
    return `This action returns all community`;
  }

  findOne(id: number) {
    return `This action returns a #${id} community`;
  }

  async update(id: number, updateCommunityDto: UpdateCommunityDto, user: User, avatar?: Express.Multer.File, banner?: Express.Multer.File) {
    delete updateCommunityDto.avatar;
    delete updateCommunityDto.banner;

    const { delete_avatar, delete_banner } = updateCommunityDto;
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
        updateCommunityDto.avatar = avatarAsset;
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
        updateCommunityDto.banner = bannerAsset;
      }
    }

    await this.communityRepository.update(id, {
      description: updateCommunityDto.description,
      title: updateCommunityDto.title,
      avatar: updateCommunityDto.avatar,
      banner: updateCommunityDto.banner
    });
    return this.findOneById(id);
  }

  async remove(id: number) {
    const community = await this.findOneById(id);
    if (community) {
      await this.communityRepository.delete({ id });
      return { success: true };
    }
    throw new NotFoundException('Community not found');
  }

  findOneById(id: number) {
    return this.communityRepository.findOneBy({ id });
  }

  async isOwnerOfCommunity(user: User, communityId: number) {
    const community = await this.findOneById(communityId);
    if (!community) {
      throw new NotFoundException('Community not found');
    }
    return community.owner.id === user.id;
  }

  async removeAvatar(communityId) {
    await this.communityRepository.update(communityId, {
      avatar: null
    });
  }

  async removeBanner(communityId) {
    await this.communityRepository.update(communityId, {
      banner: null
    });
  }
}
