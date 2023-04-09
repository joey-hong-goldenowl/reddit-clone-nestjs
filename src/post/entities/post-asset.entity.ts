import { CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Post } from './post.entity';
import { TABLE } from '../../helpers/enum/table.enum';
import { Asset } from '../../asset/entities/asset.entity';

@Entity(TABLE.POST_ASSETS)
export class PostAsset {
  @PrimaryColumn()
  post_id: number;

  @PrimaryColumn()
  asset_id: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  updated_at: Date;

  @ManyToOne(() => Post, post => post.assets)
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @OneToOne(() => Asset, { eager: true })
  @JoinColumn({ name: 'asset_id' })
  details: Asset;
}
