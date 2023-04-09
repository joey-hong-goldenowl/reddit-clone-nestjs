import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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
    const newAsset = this.assetRepository.create({
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

  async createMultiple(createAssetRequestDtoArray: CreateAssetRequestDto[]) {
    const newAssets = this.assetRepository.create(createAssetRequestDtoArray);

    return this.assetRepository.save(newAssets);
  }

  async deleteMultiple(assetIds: number[]) {
    return this.assetRepository.delete({ id: In(assetIds) });
  }
}
