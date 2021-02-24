import { PoolClient } from 'pg';
import { Edit } from '@Floor-Gang/modmail-types';
import Table from '../models/table';

export default class EditsTable extends Table {
  constructor(pool: PoolClient) {
    super(pool, 'edits');
  }

  public async add(content: string, msgID: string): Promise<Edit> {
    const res = await this.pool.query(
      `WITH last_version (num) AS (
          SELECT coalesce(
                         (SELECT version
                          FROM modmail.edits
                          WHERE message = $2
                          ORDER BY version DESC
                          LIMIT 1), 0)
      )
       INSERT
       INTO modmail.edits (content, message, version)
       VALUES ($1, $2, (SELECT num FROM last_version) + 1)
       RETURNING version;`,
      [content, msgID],
    );

    return {
      content,
      message: msgID,
      version: res.rows[0].version,
    }
  }

  public async fetch(msgID: string): Promise<Edit[]> {
    const res = await this.pool.query(
      `SELECT *
       FROM modmail.edits
       WHERE message = $1
       ORDER BY version`,
      [msgID],
    );

    return res.rows;
  }

  /**
   * Initialize the edits table
   */
  protected async init(): Promise<void> {
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS modmail.edits
       (
           content TEXT              NOT NULL,
           message BIGINT            NOT NULL
               CONSTRAINT edits_messages_modmail_id_fk
                   REFERENCES modmail.messages (modmail_id),
           version INTEGER DEFAULT 1 NOT NULL
       );`,
    );
  }
}
