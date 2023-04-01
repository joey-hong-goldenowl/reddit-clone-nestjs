import { Module } from '@nestjs/common';
import { UserModule } from 'src/user/user.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService],
  imports: [UserModule]
})
export class ProfileModule {}
