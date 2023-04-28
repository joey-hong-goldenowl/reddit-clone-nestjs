import { User } from '../../user/entities/user.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PostAsset } from './post-asset.entity';
import { TABLE } from '../../helpers/enum/table.enum';
import { PostInteraction } from './post-interaction.entity';
import { Comment } from '../../comment/entities/comment.entity';
import { Community } from '../../community/entities/community.entity';

export enum PostType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video'
}

@Entity(TABLE.POSTS)
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar')
  title: string;

  @Column('text')
  body_text: string;

  @OneToOne(() => User, { eager: true })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column('bigint')
  community_id: number;

  @OneToOne(() => Community)
  @JoinColumn({ name: 'community_id' })
  community: Community;

  @Column({
    type: 'enum',
    enum: PostType,
    default: PostType.TEXT
  })
  type: PostType;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  updated_at: Date;

  @OneToMany(() => PostAsset, postAsset => postAsset.post)
  assets?: PostAsset[];

  @OneToMany(() => PostInteraction, postInteraction => postInteraction.post)
  interactions: PostInteraction[];

  @OneToMany(() => Comment, comment => comment.post)
  comments: Comment[];
}
