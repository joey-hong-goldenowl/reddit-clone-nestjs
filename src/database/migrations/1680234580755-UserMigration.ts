import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { TABLE } from '../../helpers/enum/table.enum';

export class UserMigration1680234580755 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: TABLE.USERS,
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true
          },
          {
            name: 'username',
            type: 'text',
            isNullable: false,
            isUnique: true
          },
          {
            name: 'email',
            type: 'text',
            isNullable: false,
            isUnique: true
          },
          {
            name: 'password',
            type: 'text',
            isNullable: false
          },
          {
            name: 'display_name',
            type: 'text',
            isNullable: false
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()'
          }
        ]
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(TABLE.USERS);
  }
}
