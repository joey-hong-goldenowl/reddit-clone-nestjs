import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { TABLE } from '../../helpers/enum/table.enum';
import { User } from '../../user/entities/user.entity';

export enum MemberRole {
  OWNER = 'owner',
  MODERATOR = 'moderator',
  MEMBER = 'member'
}

@Entity(TABLE.COMMUNITY_MEMBERS)
export class CommunityMember {
  @PrimaryColumn()
  community_id: number;

  @PrimaryColumn()
  user_id: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  updated_at: Date;

  @Column({
    type: 'enum',
    enum: MemberRole,
    default: MemberRole.MEMBER
  })
  role: MemberRole;

  @OneToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  public user: User;
}
