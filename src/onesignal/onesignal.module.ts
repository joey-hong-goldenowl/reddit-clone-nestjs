import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OneSignalService } from './onesignal.service';
import { UserModule } from 'src/user/user.module';

@Module({
  providers: [OneSignalService],
  exports: [OneSignalService],
  imports: [ConfigModule, UserModule]
})
export class OnesignalModule {}
