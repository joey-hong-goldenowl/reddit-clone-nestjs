import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { TABLE } from '../../helpers/enum/table.enum';
import { Post } from './post.entity';

export enum PostInteractionType {
  UPVOTE = 'upvote',
  DOWNVOTE = 'downvote'
}

@Entity(TABLE.POST_INTERACTIONS)
export class PostInteraction {
  @PrimaryColumn()
  post_id: number;

  @PrimaryColumn()
  user_id: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  updated_at: Date;

  @Column({
    type: 'enum',
    enum: PostInteractionType,
    default: PostInteractionType.UPVOTE
  })
  type: PostInteractionType;

  @OneToOne(() => Post, post => post.interactions)
  @JoinColumn({ name: 'post_id' })
  post: Post;
}
