import { Module } from '@nestjs/common';
import { AssetModule } from 'src/asset/asset.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { CommunityModule } from 'src/community/community.module';
import { UserModule } from 'src/user/user.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService],
  imports: [UserModule, CloudinaryModule, AssetModule, CommunityModule]
})
export class ProfileModule {}
