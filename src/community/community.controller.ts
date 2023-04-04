import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import JwtAuthGuard from 'src/auth/guards/jwt-auth.guard';
import ReqWithUser from 'src/auth/interface/req-with-user.interface';
import { CommunityService } from './community.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import CommunityOwnerGuard from './guards/community-owner.guard';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req: ReqWithUser, @Body() createCommunityDto: CreateCommunityDto) {
    return this.communityService.create(req.user, createCommunityDto);
  }

  @Get()
  findAll() {
    return this.communityService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.communityService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard, CommunityOwnerGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'avatar', maxCount: 1 },
      { name: 'banner', maxCount: 1 }
    ])
  )
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req: ReqWithUser,
    @Body() updateCommunityDto: UpdateCommunityDto,
    @UploadedFiles() files: { avatar?: Express.Multer.File[]; banner?: Express.Multer.File[] }
  ) {
    return this.communityService.update(+id, updateCommunityDto, req.user, files.avatar?.[0], files.banner?.[0]);
  }

  @UseGuards(JwtAuthGuard, CommunityOwnerGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: ReqWithUser) {
    return this.communityService.remove(+id, req.user);
  }
}
