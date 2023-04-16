import { Controller, Get, Post, Body, Param, Delete, Request, UseGuards, UseInterceptors, UploadedFiles, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostRequestDto } from './dto/create-post.dto';
import { ReqWithUser } from 'src/auth/interface/auth.interface';
import JwtAuthGuard from 'src/auth/guards/jwt-auth.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { InteractPostRequestDto } from './dto/interact-post.dto';
import OptionalJwtAuthGuard from 'src/auth/guards/optional-jwt-auth.guard';
import { NEWS_FEED_FILTER } from 'src/helpers/enum/filter.enum';
import { NewsFeedFilterValidationPipe } from './pipes/post.pipe';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'assets', maxCount: 5 }]))
  @Post()
  create(@Body() createPostRequestDto: CreatePostRequestDto, @Request() req: ReqWithUser, @UploadedFiles() files: { assets?: Express.Multer.File[] }) {
    return this.postService.create(createPostRequestDto, req.user, files.assets);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('news_feed')
  getNewsFeed(
    @Query('filter', new DefaultValuePipe(NEWS_FEED_FILTER.new), NewsFeedFilterValidationPipe) filter: NEWS_FEED_FILTER,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Request() req: ReqWithUser
  ) {
    if (filter === NEWS_FEED_FILTER.new) {
      return this.postService.getNewsFeed(page, limit, req.user);
    } else {
      return this.postService.getPopularNewsFeed(page, limit, req.user);
    }
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: ReqWithUser) {
    return this.postService.findOne(+id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Request() req: ReqWithUser, @Param('id') id: string) {
    return this.postService.remove(+id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/interact')
  interactPost(@Request() req: ReqWithUser, @Param('id') id: string, @Body() interactPostRequestDto: InteractPostRequestDto) {
    return this.postService.interactPost(+id, req.user, interactPostRequestDto);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/comments')
  getComments(
    @Param('id') id: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Request() req: ReqWithUser
  ) {
    return this.postService.getComments(+id, page, limit, req.user);
  }
}
