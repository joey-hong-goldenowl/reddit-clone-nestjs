import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateCommentRequestDto } from './dto/create-comment.dto';
import { UpdateCommentRequestDto } from './dto/update-comment.dto';
import { PostService } from 'src/post/post.service';
import { User } from 'src/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Repository } from 'typeorm';
import { InteractCommentRequestDto } from './dto/interact-comment.dto';
import { CommentInteraction } from './entities/comment-interaction.entity';
import { OneSignalService } from 'src/onesignal/onesignal.service';
import { generateCommentInteractionPushNotificationMessage } from 'src/helpers/utils/string';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(CommentInteraction)
    private commentInteractionRepository: Repository<CommentInteraction>,
    private readonly postService: PostService,
    private readonly oneSignalService: OneSignalService
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

  async interactComment(commentId: number, user: User, interactCommentRequestDto: InteractCommentRequestDto) {
    const comment = await this.findOne(commentId);

    const { remove_interaction = false, type } = interactCommentRequestDto;
    const interaction = await this.commentInteractionRepository.findOneBy({ user_id: user.id, comment_id: commentId });
    if (interaction) {
      if (remove_interaction) {
        await this.commentInteractionRepository.delete({
          comment_id: commentId,
          user_id: user.id
        });
        return { success: true };
      }

      await this.commentInteractionRepository.update(
        {
          comment_id: commentId,
          user_id: user.id
        },
        {
          type
        }
      );
      this.oneSignalService.createNotification(comment.user_id, generateCommentInteractionPushNotificationMessage(type, user.username), {
        postId: comment.post_id
      });
      return this.commentInteractionRepository.findOneBy({ user_id: user.id, comment_id: commentId });
    }

    if (remove_interaction) {
      throw new NotFoundException();
    }
    const newInteraction = this.commentInteractionRepository.create({
      comment_id: commentId,
      user_id: user.id,
      type
    });
    const savedInteraction = await this.commentInteractionRepository.save(newInteraction);
    this.oneSignalService.createNotification(comment.user_id, generateCommentInteractionPushNotificationMessage(type, user.username), {
      postId: comment.post_id
    });
    return savedInteraction;
  }
}
