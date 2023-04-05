import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAssetRequestDto } from './dto/create-asset.dto';
import { UpdateAssetRequestDto } from './dto/update-asset.dto';
import { Asset } from './entities/asset.entity';

@Injectable()
export class AssetService {
  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>
  ) {}

  async create(createAssetRequestDto: CreateAssetRequestDto) {
    const newAsset = await this.assetRepository.create({
      url: createAssetRequestDto.url,
      type: createAssetRequestDto.type
    });

    return this.assetRepository.save(newAsset);
  }

  async delete(assetId: number) {
    return this.assetRepository.delete({ id: assetId });
  }

  async update(assetId: number, updateAssetRequestDto: UpdateAssetRequestDto) {
    return this.assetRepository.update(assetId, {
      ...updateAssetRequestDto
    });
  }
}
