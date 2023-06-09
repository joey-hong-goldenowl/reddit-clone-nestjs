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
import { Comment } from 'src/comment/entities/comment.entity';
import { OnesignalModule } from 'src/onesignal/onesignal.module';

@Module({
  imports: [TypeOrmModule.forFeature([Post, PostAsset, PostInteraction, Comment]), CloudinaryModule, AssetModule, CommunityModule, OnesignalModule],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService]
})
export class PostModule {}
