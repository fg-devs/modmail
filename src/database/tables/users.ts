import { Pool } from 'pg';
import Table from '../models/table';

export default class UsersTable extends Table {
  constructor(pool: Pool) {
    super(pool, 'users');
  }

  /**
   * Create a new ModmailUser
   * @param {string} id
   * @returns {Promise<void>}
   */
  public async create(id: string): Promise<void> {
    const client = await this.getClient();

    try {
      await client.query(
        `INSERT INTO modmail.users (id)
         VALUES ($1)
         ON CONFLICT (id) DO NOTHING;`,
        [id],
      );
    } finally {
      client.release();
    }
  }

  /**
   * Initialize users table
   */
  protected async init(): Promise<void> {
    const client = await this.getClient();

    try {
      await client.query(
        `CREATE TABLE IF NOT EXISTS modmail.users
         (
             id BIGINT NOT NULL
                 CONSTRAINT users_pk PRIMARY KEY
         )`,
      );

      await client.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS users_id_uindex ON modmail.users (id);`,
      );
    } finally {
      client.release();
    }
  }
}
