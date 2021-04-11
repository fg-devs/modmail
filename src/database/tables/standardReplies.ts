import { StandardReply } from '@newcircuit/modmail-types';
import { DBStandardReply } from '../types';
import { Pool } from 'pg';
import Table from '../table';

export default class StandardRepliesTable extends Table {
  constructor(pool: Pool) {
    super(pool, 'standard_replies');
  }

  /**
   * Create a new standard reply
   * @param name
   * @param reply
   */
  public async create(name: string, reply: string): Promise<void> {
    const client = await this.getClient();

    try {
      await client.query(
        `INSERT INTO modmail.standard_replies (name, reply)
         VALUES (LOWER($1), $2);`,
        [name, reply],
      );
    } finally {
      client.release();
    }
  }

  /**
   * Remove a standard reply
   * @param {string} name
   */
  public async remove(name: string): Promise<void> {
    const client = await this.getClient();

    try {
      await client.query(
        `DELETE
         FROM modmail.standard_replies
         WHERE name = LOWER($1);`,
        [name],
      );
    } finally {
      client.release();
    }
  }

  /**
   * Update a standard reply
   * @param {string} name
   * @param {string} reply
   */
  public async update(name: string, reply: string): Promise<void> {
    const client = await this.getClient();

    try {
      await client.query(
        `UPDATE modmail.standard_replies
         SET reply = $2
         WHERE name = LOWER($1)`,
        [name, reply],
      );
    } finally {
      client.release();
    }
  }

  /**
   * Get a standard reply
   * @param {string} name
   * @return {StandardReply | null}
   */
  public async fetch(name: string): Promise<StandardReply | null> {
    const client = await this.getClient();

    try {
      const res = await client.query(
        `SELECT *
         FROM modmail.standard_replies
         WHERE name = LOWER($1);`,
        [name.toLowerCase()],
      );
      if (res.rowCount === 0) {
        return null;
      }
      return StandardRepliesTable.parse(res.rows[0]);
    } finally {
      client.release();
    }
  }

  public async fetchAll(): Promise<StandardReply[]> {
    const client = await this.getClient();

    try {
      const res = await client.query(
        `SELECT *
         FROM modmail.standard_replies;`,
      );

      return res.rows.map((sr) => StandardRepliesTable.parse(sr));
    } finally {
      client.release();
    }
  }

  /**
   * Initialize standard replies table
   */
  protected async init(): Promise<void> {
    const client = await this.getClient();

    try {
      await client.query(
        `CREATE TABLE IF NOT EXISTS modmail.standard_replies
         (
             name  TEXT PRIMARY KEY NOT NULL,
             reply TEXT             NOT NULL
         );`
      );
    } finally {
      client.release();
    }
  }

  protected async migrate(): Promise<void> {
    const client = await this.getClient();

    try {
      const res = await client.query(
        `SELECT COUNT(*)
         FROM information_schema.columns
         WHERE table_name = 'standard_replies'
           AND table_schema = 'modmail'
           AND column_name = 'id';`
      );
      const count = res.rows[0].count;

      // remove ID & set all names to lowercase
      if (count > 0) {
        // noinspection SqlResolve
        await client.query(
          `ALTER TABLE modmail.standard_replies
              DROP COLUMN id;`,
        );
        await client.query(
          `CREATE UNIQUE INDEX IF NOT EXISTS standard_replies_name_uindex
              ON modmail.standard_replies (name);`,
        );
        await client.query(
          `UPDATE modmail.standard_replies
           SET name=LOWER(name);`,
        );
      }
    } finally {
      client.release();
    }
  }

  /**
   * Parse a db result into StandardReply
   * @param row
   * @return {StandardReply}
   */
  private static parse(row: DBStandardReply): StandardReply {
    return {
      name: row.name,
      reply: row.reply,
    };
  }
}
