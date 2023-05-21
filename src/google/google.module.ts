import { Module } from '@nestjs/common';
import { GoogleService } from './google.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  providers: [GoogleService],
  exports: [GoogleService],
  imports: [ConfigModule]
})
export class GoogleModule {}
