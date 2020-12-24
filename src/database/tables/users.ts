import { PoolClient } from 'pg';
import { DiscordID } from '../../models/identifiers';
import Table from '../../models/table';
import Modmail from '../../Modmail';

export default class UsersManager extends Table {
  constructor(modmail: Modmail, pool: PoolClient) {
    super(modmail, pool, 'users');
  }

  /**
   * Create a new ModmailUser
   * @param {DiscordID} id
   * @returns {Promise<void>}
   */
  public async create(id: DiscordID): Promise<void> {
    await this.pool.query(
      `INSERT INTO ${this.name} (id) VALUES ($1) ON CONFLICT (id) DO NOTHING;`,
      [id],
    );
  }

  /**
   * Initialize users table
   */
  protected async init(): Promise<void> {
    await this.pool.query(
      `IF NOT EXISTS CREATE TABLE ${this.name} (`
      + ' id bigint not null constraint users_pk primary key)',
    );

    await this.pool.query(
      `create unique index users_id_uindex on ${this.name} (id);`,
    );
  }
}
