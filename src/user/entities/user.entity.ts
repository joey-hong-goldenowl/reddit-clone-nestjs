import { Exclude } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert, OneToOne, JoinColumn } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { TABLE } from '../../helpers/enum/table.enum';
import { Asset } from '../../asset/entities/asset.entity';
import { CommunityMember } from '../../community/entities/community_member.entity';

@Entity(TABLE.USERS)
export class User {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column('text')
  public username: string;

  @Column({
    type: 'text',
    unique: true
  })
  public email: string;

  @Column({ type: 'text', select: false })
  @Exclude({ toPlainOnly: true })
  public password: string;

  @Column('text')
  public display_name: string;

  @Column('text')
  public description: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
  public created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  public updated_at: Date;

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }

  @OneToOne(() => Asset, { eager: true })
  @JoinColumn({ name: 'avatar_asset_id' })
  public avatar: Asset;

  @OneToOne(() => Asset, { eager: true })
  @JoinColumn({ name: 'background_asset_id' })
  public background: Asset;

  @OneToOne(() => CommunityMember, (communityMember: CommunityMember) => communityMember.user)
  public member_info: CommunityMember;
}
