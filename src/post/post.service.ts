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

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(PostAsset)
    private postAssetRepository: Repository<PostAsset>,
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
        community_id: createPostRequestDto.community_id,
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
      return this.findOne(addedPost.id);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  findOne(id: number) {
    return this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.assets', 'assets')
      .leftJoinAndSelect('post.owner', 'owner')
      .leftJoinAndSelect('assets.details', 'details')
      .where('post.id = :postId', { postId: id })
      .getOne();
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
}
