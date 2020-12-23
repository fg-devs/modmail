import { CONFIG } from '../../globals';
import { CategoryID, DiscordID } from '../../models/identifiers';
import { IPermissionsManager } from '../../models/interfaces';
import { DBRole, Role } from '../../models/types';
import * as PermUtil from '../../util/Perms';
import Table from '../table';

const TABLE = `${CONFIG.database.schema}.permissions`;

export default class PermManager extends Table implements IPermissionsManager {
  /**
   * Add a new role for a certain category.
   * @param {Role} role
   * @returns {Promise<boolean>} Whether it was added or not
   */
  public async add(role: Role): Promise<boolean> {
    const level = PermUtil.resolve(role.level);
    const res = await this.pool.query(
      `INSERT INTO ${TABLE} (category_id, role_id, level) VALUES ($1, $2, $3)`,
      [role.category, role.roleID, level],
    );

    return res.rowCount !== 0;
  }

  /**
   * Remove a role. We don't need to intake the category because all role ID's
   * are unique and two categories can't have the same role ID.
   * @param {DiscordID} id
   * @returns {Promise<boolean>} Whether it was removed or not
   */
  public async remove(id: DiscordID): Promise<boolean> {
    const res = await this.pool.query(
      `DELETE FROM ${TABLE} WHERE role_id=$1`,
      [id],
    );

    return res.rowCount !== 0;
  }

  public async fetch(roleID: DiscordID): Promise<Role | null> {
    const res = await this.pool.query(
      `SELECT * FROM ${TABLE} WHERE role_id=$1`,
      [roleID],
    );

    if (res.rowCount === 0) {
      return null;
    }

    return PermManager.parse(res.rows[0]);
  }

  public async fetchAll(category: CategoryID): Promise<Role[]> {
    const res = await this.pool.query(
      `SELECT * FROM ${TABLE} WHERE category_id=$1`,
      [category],
    );

    return res.rows.map(PermManager.parse);
  }

  private static parse(role: DBRole): Role {
    return {
      category: role.category,
      roleID: role.role_id,
      level: PermUtil.resolveStr(role.level),
    };
  }
}
