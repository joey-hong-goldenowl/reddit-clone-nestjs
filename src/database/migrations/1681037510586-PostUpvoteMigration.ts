import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';
import { PostInteractionType } from '../../post/entities/post-interaction.entity';
import { TABLE } from '../../helpers/enum/table.enum';

export class PostUpvoteMigration1681037510586 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: TABLE.POST_INTERACTIONS,
        columns: [
          {
            name: 'post_id',
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
            enum: Object.keys(PostInteractionType).map(key => PostInteractionType[key]),
            enumName: 'postInteractionTypeEnum',
            isNullable: false
          }
        ]
      })
    );

    await queryRunner.createForeignKeys(TABLE.POST_INTERACTIONS, [
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
    const postInteractionsTable = await queryRunner.getTable(TABLE.POST_INTERACTIONS);
    const postForeignKey = postInteractionsTable.foreignKeys.find(fk => fk.columnNames.indexOf('post_id') !== -1);
    const userForeignKey = postInteractionsTable.foreignKeys.find(fk => fk.columnNames.indexOf('user_id') !== -1);
    await queryRunner.dropForeignKeys(TABLE.POST_INTERACTIONS, [postForeignKey, userForeignKey]);
    await queryRunner.dropTable(TABLE.POST_INTERACTIONS);
    await queryRunner.query('DROP TYPE postInteractionTypeEnum');
  }
}
