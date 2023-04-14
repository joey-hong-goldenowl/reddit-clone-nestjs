import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TABLE } from '../../helpers/enum/table.enum';
import { User } from '../../user/entities/user.entity';
import { Post } from '../../post/entities/post.entity';
import { CommentInteraction } from './comment-interaction.entity';

@Entity(TABLE.COMMENTS)
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('bigint')
  user_id: number;

  @Column('bigint')
  post_id: number;

  @Column('text')
  content: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  updated_at: Date;

  @OneToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  owner: User;

  @OneToOne(() => Post)
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @OneToMany(() => CommentInteraction, commentInteraction => commentInteraction.comment)
  interactions: CommentInteraction[];
}
