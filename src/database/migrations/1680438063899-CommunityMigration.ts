import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';
import { TABLE } from '../../helpers/enum/table.enum';

export class CommunityMigration1680438063899 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: TABLE.COMMUNITIES,
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true
          },
          {
            name: 'name',
            type: 'text',
            isUnique: true,
            isNullable: false
          },
          {
            name: 'title',
            type: 'text',
            isNullable: false
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true
          },
          {
            name: 'avatar_asset_id',
            type: 'bigint',
            isNullable: true
          },
          {
            name: 'banner_asset_id',
            type: 'bigint',
            isNullable: true
          },
          {
            name: 'owner_id',
            type: 'bigint',
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

    await queryRunner.createForeignKeys(TABLE.COMMUNITIES, [
      new TableForeignKey({
        columnNames: ['avatar_asset_id'],
        referencedColumnNames: ['id'],
        referencedTableName: TABLE.ASSETS,
      }),
      new TableForeignKey({
        columnNames: ['banner_asset_id'],
        referencedColumnNames: ['id'],
        referencedTableName: TABLE.ASSETS,
      }),
      new TableForeignKey({
        columnNames: ['owner_id'],
        referencedColumnNames: ['id'],
        referencedTableName: TABLE.USERS
      })
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const communitiesTable = await queryRunner.getTable(TABLE.COMMUNITIES);
    const avatarForeignKey = communitiesTable.foreignKeys.find(fk => fk.columnNames.indexOf('avatar_asset_id') !== -1);
    const bannerForeignKey = communitiesTable.foreignKeys.find(fk => fk.columnNames.indexOf('banner_asset_id') !== -1);
    const ownerForeignKey = communitiesTable.foreignKeys.find(fk => fk.columnNames.indexOf('owner_id') !== -1);
    await queryRunner.dropForeignKeys(TABLE.COMMUNITIES, [avatarForeignKey, bannerForeignKey, ownerForeignKey]);
    await queryRunner.dropTable(TABLE.COMMUNITIES);
  }
}
