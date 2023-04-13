import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateCommentRequestDto } from './dto/create-comment.dto';
import { UpdateCommentRequestDto } from './dto/update-comment.dto';
import { PostService } from 'src/post/post.service';
import { User } from 'src/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    private readonly postService: PostService
  ) {}

  async create(createCommentRequestDto: CreateCommentRequestDto, user: User) {
    const { post_id, content } = createCommentRequestDto;
    await this.postService.findOne(post_id);

    const newComment = this.commentRepository.create({
      post_id,
      content,
      owner: user
    });
    return this.commentRepository.save(newComment);
  }

  findAll() {
    return `This action returns all comment`;
  }

  async findOne(id: number) {
    const comment = await this.commentRepository.findOneBy({ id });
    if (!comment) {
      throw new NotFoundException(`Comment doesn't exist`);
    }
    return comment;
  }

  async update(id: number, updateCommentRequestDto: UpdateCommentRequestDto, user: User) {
    const comment = await this.findOne(id);

    if (!this.isOwnerOfComment(user.id, comment)) {
      throw new UnauthorizedException();
    }

    const { content } = updateCommentRequestDto;
    await this.commentRepository.update(id, {
      content
    });
    return this.findOne(id);
  }

  async remove(id: number, user: User) {
    const comment = await this.findOne(id);

    if (!this.isOwnerOfComment(user.id, comment)) {
      throw new UnauthorizedException();
    }

    await this.commentRepository.delete({ id });
    return { success: true };
  }

  isOwnerOfComment(userId: number, comment: Comment) {
    return comment.user_id === userId;
  }
}
