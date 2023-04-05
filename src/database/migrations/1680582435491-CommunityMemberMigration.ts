import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';
import { TABLE } from '../../helpers/enum/table.enum';

export class CommunityMemberMigration1680582435491 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: TABLE.COMMUNITY_MEMBERS,
        columns: [
          {
            name: 'community_id',
            type: 'bigint',
            isPrimary: true
          },
          {
            name: 'user_id',
            type: 'bigint',
            isPrimary: true
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

    await queryRunner.createForeignKeys(TABLE.COMMUNITY_MEMBERS, [
      new TableForeignKey({
        columnNames: ['community_id'],
        referencedColumnNames: ['id'],
        referencedTableName: TABLE.COMMUNITIES
      }),
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: TABLE.USERS
      })
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const communityMembersTable = await queryRunner.getTable(TABLE.COMMUNITY_MEMBERS);
    const communityForeignKey = communityMembersTable.foreignKeys.find(fk => fk.columnNames.indexOf('community_id') !== -1);
    const userForeignKey = communityMembersTable.foreignKeys.find(fk => fk.columnNames.indexOf('user_id') !== -1);
    await queryRunner.dropForeignKeys(TABLE.COMMUNITY_MEMBERS, [communityForeignKey, userForeignKey]);
    await queryRunner.dropTable(TABLE.COMMUNITY_MEMBERS);
  }
}
