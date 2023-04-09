import { Asset } from '../../asset/entities/asset.entity';
import { BeforeInsert, Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TABLE } from '../../helpers/enum/table.enum';
import { User } from '../../user/entities/user.entity';
import { CommunityMember } from './community_member.entity';

@Entity(TABLE.COMMUNITIES)
export class Community {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  name: string;

  @Column('text')
  title: string;

  @Column('text')
  description: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
  public created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  public updated_at: Date;

  @OneToOne(() => Asset, { eager: true })
  @JoinColumn({ name: 'avatar_asset_id' })
  public avatar: Asset;

  @OneToOne(() => Asset, { eager: true })
  @JoinColumn({ name: 'banner_asset_id' })
  public banner: Asset;

  @OneToOne(() => User, { eager: true })
  @JoinColumn({ name: 'owner_id' })
  public owner: User;

  @BeforeInsert()
  generateTitle() {
    this.title = this.name;
  }

  @OneToMany(() => CommunityMember, communityMember => communityMember.community)
  members?: CommunityMember[];
}
