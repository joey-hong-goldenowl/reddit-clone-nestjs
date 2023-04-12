import { Controller, Get, Post, Body, Param, Delete, Request, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostRequestDto } from './dto/create-post.dto';
import { ReqWithUser } from 'src/auth/interface/auth.interface';
import JwtAuthGuard from 'src/auth/guards/jwt-auth.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { InteractPostRequestDto } from './dto/interact-post.dto';
import OptionalJwtAuthGuard from 'src/auth/guards/optional-jwt-auth.guard';

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
  @Post(':id/interaction')
  interactPost(@Request() req: ReqWithUser, @Param('id') id: string, @Body() interactPostRequestDto: InteractPostRequestDto) {
    return this.postService.interactPost(+id, req.user, interactPostRequestDto);
  }
}
