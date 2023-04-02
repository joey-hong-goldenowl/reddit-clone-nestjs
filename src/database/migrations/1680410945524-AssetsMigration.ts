import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';
import { TABLE } from '../../helpers/enum/table.enum';

export class AssetsMigration1680410945524 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: TABLE.ASSETS,
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true
          },
          {
            name: 'url',
            type: 'text',
            isNullable: false
          },
          {
            name: 'type',
            type: 'text',
            isNullable: false
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

    await queryRunner.addColumns(TABLE.USERS, [
      new TableColumn({
        name: 'avatar_asset_id',
        type: 'bigint',
        isNullable: true
      }),
      new TableColumn({
        name: 'background_asset_id',
        type: 'bigint',
        isNullable: true
      })
    ]);

    await queryRunner.createForeignKeys(TABLE.USERS, [
      new TableForeignKey({
        columnNames: ['avatar_asset_id'],
        referencedColumnNames: ['id'],
        referencedTableName: TABLE.ASSETS
      }),
      new TableForeignKey({
        columnNames: ['background_asset_id'],
        referencedColumnNames: ['id'],
        referencedTableName: TABLE.ASSETS
      })
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const usersTable = await queryRunner.getTable(TABLE.USERS);
    const avatarForeignKey = usersTable.foreignKeys.find(fk => fk.columnNames.indexOf('avatar_asset_id') !== -1);
    const backgroundForeignKey = usersTable.foreignKeys.find(fk => fk.columnNames.indexOf('background_asset_id') !== -1);
    await queryRunner.dropForeignKeys(TABLE.USERS, [avatarForeignKey, backgroundForeignKey]);
    await queryRunner.dropColumns(TABLE.USERS, ['avatar_asset_id', 'background_asset_id']);
    await queryRunner.dropTable(TABLE.ASSETS);
  }
}
