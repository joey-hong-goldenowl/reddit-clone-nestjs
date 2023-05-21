import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';
import { TABLE } from '../../helpers/enum/table.enum';
import { CommentInteractionType } from '../../comment/entities/comment-interaction.entity';

export class CommentInteractionMigration1681360076591 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: TABLE.COMMENT_INTERACTIONS,
        columns: [
          {
            name: 'comment_id',
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
          },
          {
            name: 'type',
            type: 'enum',
            enum: Object.keys(CommentInteractionType).map(key => CommentInteractionType[key]),
            enumName: 'commentInteractionTypeEnum',
            isNullable: false
          }
        ]
      })
    );

    await queryRunner.createForeignKeys(TABLE.COMMENT_INTERACTIONS, [
      new TableForeignKey({
        columnNames: ['comment_id'],
        referencedColumnNames: ['id'],
        referencedTableName: TABLE.COMMENTS,
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
    const commentInteractionsTable = await queryRunner.getTable(TABLE.COMMENT_INTERACTIONS);
    const commentForeignKey = commentInteractionsTable.foreignKeys.find(fk => fk.columnNames.indexOf('comment_id') !== -1);
    const userForeignKey = commentInteractionsTable.foreignKeys.find(fk => fk.columnNames.indexOf('user_id') !== -1);
    await queryRunner.dropForeignKeys(TABLE.COMMENT_INTERACTIONS, [commentForeignKey, userForeignKey]);
    await queryRunner.dropTable(TABLE.COMMENT_INTERACTIONS);
    await queryRunner.query('DROP TYPE commentInteractionTypeEnum');
  }
}
