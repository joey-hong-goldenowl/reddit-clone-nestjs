import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { TABLE } from '../../helpers/enum/table.enum';

export class NotificationMigration1682565550960 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      TABLE.USERS,
      new TableColumn({
        name: 'onesignal_player_id',
        type: 'text',
        isNullable: true
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(TABLE.USERS, 'onesignal_player_id');
  }
}
