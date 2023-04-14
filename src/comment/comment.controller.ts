import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentRequestDto } from './dto/create-comment.dto';
import { UpdateCommentRequestDto } from './dto/update-comment.dto';
import JwtAuthGuard from 'src/auth/guards/jwt-auth.guard';
import { ReqWithUser } from 'src/auth/interface/auth.interface';
import { InteractCommentRequestDto } from './dto/interact-comment.dto';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createCommentRequestDto: CreateCommentRequestDto, @Request() req: ReqWithUser) {
    return this.commentService.create(createCommentRequestDto, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commentService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCommentRequestDto: UpdateCommentRequestDto, @Request() req: ReqWithUser) {
    return this.commentService.update(+id, updateCommentRequestDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: ReqWithUser) {
    return this.commentService.remove(+id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/interact')
  interactComment(@Param('id') id: string, @Body() interactCommentRequestDto: InteractCommentRequestDto, @Request() req: ReqWithUser) {
    return this.commentService.interactComment(+id, req.user, interactCommentRequestDto);
  }
}
