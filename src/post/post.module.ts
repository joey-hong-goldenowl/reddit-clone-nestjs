import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { PostAsset } from './entities/post-asset.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { AssetModule } from 'src/asset/asset.module';
import { CommunityModule } from 'src/community/community.module';
import { PostInteraction } from './entities/post-interaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, PostAsset, PostInteraction]), CloudinaryModule, AssetModule, CommunityModule],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService]
})
export class PostModule {}
