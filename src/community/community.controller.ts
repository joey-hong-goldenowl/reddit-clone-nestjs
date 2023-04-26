import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  HttpCode
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import JwtAuthGuard from 'src/auth/guards/jwt-auth.guard';
import { ReqWithUser } from 'src/auth/interface/auth.interface';
import { CommunityService } from './community.service';
import { CreateCommunityRequestDto } from './dto/create-community.dto';
import { UpdateCommunityRequestDto } from './dto/update-community.dto';
import RolesGuard from './guards/roles.guard';
import { MemberRole } from './entities/community_member.entity';
import Roles from './decorators/roles.decorator';
import OptionalJwtAuthGuard from 'src/auth/guards/optional-jwt-auth.guard';
import { POST_FILTER } from 'src/helpers/enum/filter.enum';
import { PostFilterValidationPipe } from './pipes/post.pipe';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req: ReqWithUser, @Body() createCommunityRequestDto: CreateCommunityRequestDto) {
    return this.communityService.create(req.user, createCommunityRequestDto);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  findAll(@Request() req: ReqWithUser, @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number, @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number) {
    return this.communityService.findAll(page, limit, req.user);
  }

  @Get('search-recommendation')
  searchRecommendations(@Query('search-key', new DefaultValuePipe('')) searchKey: string) {
    return this.communityService.getRecommendations(searchKey);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('search')
  search(
    @Request() req: ReqWithUser,
    @Query('search-key', new DefaultValuePipe('')) searchKey: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number
  ) {
    return this.communityService.search(searchKey, page, limit, req.user);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: ReqWithUser) {
    return this.communityService.findOneByIdWithMemberCount(+id, req.user);
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

  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @Post(':id/leave')
  leaveCommunity(@Param('id') id: string, @Request() req: ReqWithUser) {
    return this.communityService.leaveCommunity(+id, req.user);
  }

  @Get(':id/members')
  getMemberList(
    @Param('id') id: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number
  ) {
    return this.communityService.getMemberList(+id, page, limit);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/posts')
  getPosts(
    @Param('id') id: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('filter', new DefaultValuePipe(POST_FILTER.new), PostFilterValidationPipe) filter: POST_FILTER,
    @Request() req: ReqWithUser
  ) {
    return this.communityService.getPostList(+id, filter, page, limit, req.user);
  }
}
