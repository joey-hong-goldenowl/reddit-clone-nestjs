import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { PostModule } from '../../src/post/post.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { CommentInteraction } from './entities/comment-interaction.entity';
import { OnesignalModule } from 'src/onesignal/onesignal.module';

@Module({
  controllers: [CommentController],
  providers: [CommentService],
  imports: [TypeOrmModule.forFeature([Comment, CommentInteraction]), PostModule, OnesignalModule]
})
export class CommentModule {}
