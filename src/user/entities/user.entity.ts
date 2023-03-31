import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column('text')
  public username: string;

  @Column({
    unique: true
  })
  public email: string;

  @Column('text')
  public password: string;

  @Column('text')
  public display_name: string;

  @Column('text')
  public description: string;

  @Column({ type: 'boolean', default: false })
  public is_deleted: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(0)' })
  public created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(0)', onUpdate: 'CURRENT_TIMESTAMP(0)' })
  public updated_at: Date;
}
