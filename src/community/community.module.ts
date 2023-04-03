import { Module } from '@nestjs/common';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Community } from './entities/community.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { AssetModule } from 'src/asset/asset.module';

@Module({
  imports: [TypeOrmModule.forFeature([Community]), CloudinaryModule, AssetModule],
  controllers: [CommunityController],
  providers: [CommunityService]
})
export class CommunityModule {}
