import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';
import { TABLE } from '../../helpers/enum/table.enum';

export class CommentMigration1681273734364 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: TABLE.COMMENTS,
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true
          },
          {
            name: 'post_id',
            type: 'bigint',
            isNullable: false
          },
          {
            name: 'user_id',
            type: 'bigint',
            isNullable: false
          },
          {
            name: 'content',
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

    await queryRunner.createForeignKeys(TABLE.COMMENTS, [
      new TableForeignKey({
        columnNames: ['post_id'],
        referencedColumnNames: ['id'],
        referencedTableName: TABLE.POSTS,
        onDelete: 'CASCADE'
      }),
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: TABLE.USERS,
        onDelete: 'CASCADE'
      })
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const commentsTable = await queryRunner.getTable(TABLE.COMMENTS);
    const postForeignKey = commentsTable.foreignKeys.find(fk => fk.columnNames.indexOf('post_id') !== -1);
    const userForeignKey = commentsTable.foreignKeys.find(fk => fk.columnNames.indexOf('user_id') !== -1);
    await queryRunner.dropForeignKeys(TABLE.COMMENTS, [postForeignKey, userForeignKey]);
    await queryRunner.dropTable(TABLE.COMMENTS);
  }
}
