import { CONFIG } from '../globals';
import { DiscordID } from '../models/identifiers';
import { IUserManager } from '../models/interfaces';
import Table from './table';

const TABLE = `${CONFIG.database.schema}.users`;

export default class UsersManager extends Table implements IUserManager {
  /**
   * Create a new ModmailUser
   * @param {DiscordID} id
   * @returns {Promise<void>}
   */
  public async create(id: DiscordID): Promise<void> {
    await this.pool.query(
      `INSERT INTO ${TABLE} (id) VALUES ($1) ON CONFLICT (id) DO NOTHING;`,
      [id],
    );
  }
}
