import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';
import { TABLE } from '../../helpers/enum/table.enum';
import { PostType } from '../../post/entities/post.entity';

export class PostMigration1680950613954 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: TABLE.POSTS,
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true
          },
          {
            name: 'title',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'body_text',
            type: 'text',
            isNullable: true
          },
          {
            name: 'community_id',
            type: 'bigint',
            isNullable: false
          },
          {
            name: 'owner_id',
            type: 'bigint',
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
          },
          {
            name: 'type',
            type: 'enum',
            enum: Object.keys(PostType).map(key => PostType[key]),
            enumName: 'postTypeEnum',
            isNullable: false
          }
        ]
      })
    );

    await queryRunner.createForeignKeys(TABLE.POSTS, [
      new TableForeignKey({
        columnNames: ['community_id'],
        referencedColumnNames: ['id'],
        referencedTableName: TABLE.COMMUNITIES,
        onDelete: 'CASCADE'
      }),
      new TableForeignKey({
        columnNames: ['owner_id'],
        referencedColumnNames: ['id'],
        referencedTableName: TABLE.USERS,
        onDelete: 'CASCADE'
      })
    ]);

    await queryRunner.createTable(
      new Table({
        name: TABLE.POST_ASSETS,
        columns: [
          {
            name: 'post_id',
            type: 'bigint',
            isPrimary: true
          },
          {
            name: 'asset_id',
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

    await queryRunner.createForeignKeys(TABLE.POST_ASSETS, [
      new TableForeignKey({
        columnNames: ['post_id'],
        referencedColumnNames: ['id'],
        referencedTableName: TABLE.POSTS,
        onDelete: 'CASCADE'
      }),
      new TableForeignKey({
        columnNames: ['asset_id'],
        referencedColumnNames: ['id'],
        referencedTableName: TABLE.ASSETS,
        onDelete: 'CASCADE'
      })
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const postAssetsTable = await queryRunner.getTable(TABLE.POST_ASSETS);
    const postForeignKey = postAssetsTable.foreignKeys.find(fk => fk.columnNames.indexOf('post_id') !== -1);
    const assetForeignKey = postAssetsTable.foreignKeys.find(fk => fk.columnNames.indexOf('asset_id') !== -1);
    await queryRunner.dropForeignKeys(TABLE.POST_ASSETS, [postForeignKey, assetForeignKey]);
    await queryRunner.dropTable(TABLE.POST_ASSETS);

    const postsTable = await queryRunner.getTable(TABLE.POSTS);
    const communityForeignKey = postsTable.foreignKeys.find(fk => fk.columnNames.indexOf('community_id') !== -1);
    const ownerForeignKey = postsTable.foreignKeys.find(fk => fk.columnNames.indexOf('owner_id') !== -1);
    await queryRunner.dropForeignKeys(TABLE.POSTS, [communityForeignKey, ownerForeignKey]);
    await queryRunner.dropTable(TABLE.POSTS);
  }
}
