import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Comment } from './comment.entity';
import { TABLE } from '../../helpers/enum/table.enum';

export enum CommentInteractionType {
  UPVOTE = 'upvote',
  DOWNVOTE = 'downvote'
}

@Entity(TABLE.COMMENT_INTERACTIONS)
export class CommentInteraction {
  @PrimaryColumn()
  comment_id: number;

  @PrimaryColumn()
  user_id: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  updated_at: Date;

  @Column({
    type: 'enum',
    enum: CommentInteractionType,
    default: CommentInteractionType.UPVOTE
  })
  type: CommentInteractionType;

  @OneToOne(() => Comment, comment => comment.interactions)
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;
}
