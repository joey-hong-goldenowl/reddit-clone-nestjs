import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { TABLE } from '../../helpers/enum/table.enum';

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
}
