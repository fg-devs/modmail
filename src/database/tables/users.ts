import { PoolClient } from 'pg';
import Table from '../../models/table';
import Modmail from '../../Modmail';

export default class UsersManager extends Table {
  constructor(modmail: Modmail, pool: PoolClient) {
    super(modmail, pool, 'users');
  }

  /**
   * Create a new ModmailUser
   * @param {string} id
   * @returns {Promise<void>}
   */
  public async create(id: string): Promise<void> {
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
      `CREATE TABLE IF NOT EXISTS ${this.name} (`
      + ' id bigint not null constraint users_pk primary key)',
    );

    await this.pool.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS users_id_uindex ON ${this.name} (id);`,
    );
  }
}
