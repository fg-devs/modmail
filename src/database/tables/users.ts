import { PoolClient } from 'pg';
import Table from '../models/table';

export default class UsersTable extends Table {
  constructor(pool: PoolClient) {
    super(pool, 'users');
  }

  /**
   * Create a new ModmailUser
   * @param {string} id
   * @returns {Promise<void>}
   */
  public async create(id: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO modmail.users (id)
       VALUES ($1)
       ON CONFLICT (id) DO NOTHING;`,
      [id],
    );
  }

  /**
   * Initialize users table
   */
  protected async init(): Promise<void> {
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS modmail.users
       (
           id BIGINT NOT NULL
               CONSTRAINT users_pk PRIMARY KEY
       )`,
    );

    await this.pool.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS users_id_uindex ON modmail.users (id);`,
    );
  }
}
