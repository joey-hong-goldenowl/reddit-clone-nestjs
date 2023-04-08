import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UseInterceptors, UploadedFiles, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import JwtAuthGuard from 'src/auth/guards/jwt-auth.guard';
import { ReqWithUser } from 'src/auth/interface/auth.interface';
import { CommunityService } from './community.service';
import { CreateCommunityRequestDto } from './dto/create-community.dto';
import { UpdateCommunityRequestDto } from './dto/update-community.dto';
import RolesGuard from './guards/roles.guard';
import { MemberRole } from './entities/community_member.entity';
import Roles from './decorators/roles.decorator';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req: ReqWithUser, @Body() createCommunityRequestDto: CreateCommunityRequestDto) {
    return this.communityService.create(req.user, createCommunityRequestDto);
  }

  @Get()
  findAll() {
    return this.communityService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.communityService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(MemberRole.OWNER)
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
    @Body() updateCommunityRequestDto: UpdateCommunityRequestDto,
    @UploadedFiles() files: { avatar?: Express.Multer.File[]; banner?: Express.Multer.File[] }
  ) {
    return this.communityService.update(+id, updateCommunityRequestDto, req.user, files.avatar?.[0], files.banner?.[0]);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  @Roles(MemberRole.OWNER)
  remove(@Param('id') id: string, @Request() req: ReqWithUser) {
    return this.communityService.remove(+id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  joinCommunity(@Param('id') id: string, @Request() req: ReqWithUser) {
    return this.communityService.joinCommunity(+id, req.user);
  }

  @Get(':id/members')
  getMemberList(
    @Param('id') id: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number
  ) {
    return this.communityService.getMemberList(+id, page, limit);
  }
}
