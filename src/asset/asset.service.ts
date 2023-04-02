import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { Asset } from './entities/asset.entity';

@Injectable()
export class AssetService {
  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>
  ) {}

  async create(createAssetDto: CreateAssetDto) {
    const newAsset = await this.assetRepository.create({
      url: createAssetDto.url,
      type: createAssetDto.type
    });

    return this.assetRepository.save(newAsset);
  }

  async delete(assetId: number) {
    return this.assetRepository.delete({ id: assetId });
  }

  async update(assetId: number, updateAssetDto: UpdateAssetDto) {
    return this.assetRepository.update(assetId, {
      ...updateAssetDto
    });
  }
}
