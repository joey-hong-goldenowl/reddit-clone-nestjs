import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { TABLE } from '../../helpers/enum/table.enum';
import { UserLoginType } from '../../user/entities/user.entity';

export class GoogleSignInMigration1683172466866 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      TABLE.USERS,
      new TableColumn({
        name: 'login_type',
        type: 'enum',
        enum: Object.keys(UserLoginType).map(key => UserLoginType[key]),
        enumName: 'userLoginType',
        default: `'${UserLoginType.EMAIL}'`
      })
    );

    await queryRunner.addColumn(
      TABLE.USERS,
      new TableColumn({
        name: 'update_username',
        type: 'boolean',
        default: false
      })
    );

    await queryRunner.query(`ALTER TABLE ${TABLE.USERS} ALTER COLUMN password DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE ${TABLE.USERS} ALTER COLUMN password SET NOT NULL`);

    await queryRunner.dropColumn(TABLE.USERS, 'update_username');
    await queryRunner.dropColumn(TABLE.USERS, 'login_type');
    await queryRunner.query('DROP TYPE userLoginType');
  }
}
