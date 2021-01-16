import { DBRole, Role } from 'modmail-types';
import { PoolClient } from 'pg';
import * as PermUtil from '../../util/Perms';
import Table from '../../models/table';
import Modmail from '../../Modmail';

export default class PermManager extends Table {
  constructor(modmail: Modmail, pool: PoolClient) {
    super(modmail, pool, 'permissions');
  }

  /**
   * Add a new role for a certain category.
   * @param {Role} role
   * @returns {Promise<boolean>} Whether it was added or not
   */
  public async add(role: Role): Promise<boolean> {
    const level = PermUtil.resolve(role.level);
    const res = await this.pool.query(
      `INSERT INTO ${this.name} (category_id, role_id, level) VALUES ($1, $2, $3)`,
      [role.category, role.roleID, level],
    );

    return res.rowCount !== 0;
  }

  /**
   * Remove a role. We don't need to intake the category because all role ID's
   * are unique and two categories can't have the same role ID.
   * @param {string} id
   * @returns {Promise<boolean>} Whether it was removed or not
   */
  public async remove(id: string): Promise<boolean> {
    const res = await this.pool.query(
      `DELETE FROM ${this.name} WHERE role_id=$1`,
      [id],
    );

    return res.rowCount !== 0;
  }

  public async fetch(roleID: string): Promise<Role | null> {
    const res = await this.pool.query(
      `SELECT * FROM ${this.name} WHERE role_id=$1`,
      [roleID],
    );

    if (res.rowCount === 0) {
      return null;
    }

    return PermManager.parse(res.rows[0]);
  }

  public async fetchAll(category: string): Promise<Role[]> {
    const res = await this.pool.query(
      `SELECT * FROM ${this.name} WHERE category_id=$1`,
      [category],
    );

    return res.rows.map(PermManager.parse);
  }

  /**
   * Initialize the permisisons table
   */
  protected async init(): Promise<void> {
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS ${this.name} (`
      + ' category_id bigint not null'
      + '   references modmail.categories,'
      + ' role_id text unique not null,'
      + " level modmail.role_level default 'mod'::modmail.role_level not null)",
    );

    await this.pool.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS permissions_role_id_uindex on ${this.name} (role_id)`,
    );
  }

  private static parse(role: DBRole): Role {
    return {
      category: role.category_id.toString(),
      roleID: role.role_id.toString(),
      level: PermUtil.resolveStr(role.level),
    };
  }
}
