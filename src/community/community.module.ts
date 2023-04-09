import { Module } from '@nestjs/common';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Community } from './entities/community.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { AssetModule } from 'src/asset/asset.module';
import { CommunityMember } from './entities/community_member.entity';
import { User } from 'src/user/entities/user.entity';
import { Post } from 'src/post/entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Community, CommunityMember, User, Post]), CloudinaryModule, AssetModule],
  controllers: [CommunityController],
  providers: [CommunityService],
  exports: [CommunityService]
})
export class CommunityModule {}
