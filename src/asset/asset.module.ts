import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetService } from './asset.service';
import { Asset } from './entities/asset.entity';

@Module({
  providers: [AssetService],
  exports: [AssetService],
  imports: [TypeOrmModule.forFeature([Asset])]
})
export class AssetModule {}
