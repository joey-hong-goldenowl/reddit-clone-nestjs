import { CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { TABLE } from '../../helpers/enum/table.enum';

@Entity(TABLE.COMMUNITY_MEMBERS)
export class CommunityMember {
  @PrimaryColumn()
  community_id: number;

  @PrimaryColumn()
  user_id: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
  public created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)' })
  public updated_at: Date;
}
