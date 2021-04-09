import { Thread } from '@newcircuit/modmail-types';
import { DBThread } from '../types';
import { SnowflakeUtil } from 'discord.js';
import { Pool } from 'pg';
import Table from '../table';

export default class ThreadsTable extends Table {
  constructor(pool: Pool) {
    super(pool, 'threads');
  }

  public async participants(threadID: string): Promise<string[]> {
    const client = await this.getClient();

    try {
      const res = await client.query(
        `SELECT DISTINCT sender FROM modmail.messages WHERE thread_id = $1;`,
        [threadID],
      );

      return res.rows;
    } finally {
      client.release();
    }
  }

  public async history(
    userID: string,
    catID: string | null = null,
  ): Promise<Thread[]> {
    const client = await this.getClient();
    let res;

    try {
      res = await client.query(
        `SELECT DISTINCT thread_id FROM modmail.messages WHERE sender = $1`,
        [userID],
      );

      const threadIDs = res.rows.map((th) => th.thread_id);;
      if (catID === null) {
        res = await client.query(
          `SELECT * FROM modmail.threads WHERE id = ANY ($1) ORDER BY id DESC`,
          [threadIDs],
        );
      } else {
        res = await client.query(
          `SELECT * FROM modmail.threads
             WHERE id = ANY ($1)
             AND category = $2
             ORDER BY id DESC;`,
          [threadIDs, catID],
        );
      }

      return res.rows.map((thread) => ThreadsTable.parse(thread));
    } finally {
      client.release();
    }
  }

  /**
   * Mark a thread a closed
   * @method close
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  public async close(id: string): Promise<boolean> {
    const client = await this.getClient();

    try {
      const res = await client.query(
        `UPDATE modmail.threads
         SET is_active = false
         WHERE channel = $1;`,
        [id],
      );

      return res.rowCount !== 0;
    } finally {
      client.release();
    }
  }

  /**
   * @param {string} author
   * @param {string} channelID
   * @param {string} categoryID
   * @param {boolean} isAdminOnly
   * @returns {Promise<Thread>}
   */
  public async open(
    author: string,
    channelID: string,
    categoryID: string,
    isAdminOnly: boolean,
  ): Promise<Thread> {
    const client = await this.getClient();
    const threadID = SnowflakeUtil.generate(Date.now());

    try {
      await client.query(
        `INSERT INTO modmail.threads (id, author, channel, category, is_admin_only)
         VALUES ($1, $2, $3, $4, $5);`,
        [threadID, author, channelID, categoryID, isAdminOnly],
      );

      return {
        author: {
          id: author,
        },
        isAdminOnly,
        channel: channelID,
        category: categoryID,
        id: threadID,
        isActive: true,
        messages: [],
      };
    } finally {
      client.release();
    }
  }

  /**
   * Count the number of past threads for a user
   * @param {string} user
   * @returns {Promise<number>}
   */
  public async countUser(user: string): Promise<number> {
    const client = await this.getClient();

    try {
      const res = await client.query(
        `SELECT COUNT(*)
         FROM modmail.threads
         WHERE author = $1
           AND is_active = false;`,
        [user],
      );

      return res.rows[0].count;
    } finally {
      client.release();
    }
  }

  public async countCategory(category: string): Promise<number> {
    const client = await this.getClient();

    try {
      const res = await client.query(
        `SELECT COUNT(*)
         FROM modmail.threads
         WHERE category = $1
           AND is_active = true;`,
        [category],
      );
      return res.rows[0].count;
    } finally {
      client.release();
    }
  }

  public async getByUser(userID: string): Promise<Thread | null> {
    const client = await this.getClient();

    try {
      const res = await client.query(
        `SELECT *
         FROM modmail.threads
         WHERE author = $1
           AND is_active = true
         LIMIT 1;`,
        [userID],
      );
      if (res.rowCount === 0) {
        return null;
      }

      return ThreadsTable.parse(res.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * @param {string} user
   * @returns {Promise<Thread | null>} if thread was found
   */
  public async getCurrentThread(user: string): Promise<Thread | null> {
    const client = await this.getClient();

    try {
      const res = await client.query(
        `SELECT *
         FROM modmail.threads
         WHERE author = $1
           AND is_active = true
         LIMIT 1;`,
        [user],
      );
      if (res.rowCount === 0) {
        return null;
      }

      return ThreadsTable.parse(res.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * @param {string} channelID
   * @returns {Promise<Thread | null>}
   */
  public async getByChannel(channelID: string): Promise<Thread | null> {
    const client = await this.getClient();

    try {
      const res = await client.query(
        `SELECT *
         FROM modmail.threads
         WHERE channel = $1
           AND is_active = true
         LIMIT 1;`,
        [channelID],
      );

      if (res.rowCount === 0) {
        return null;
      }

      return ThreadsTable.parse(res.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * Get all threads by category ID
   * @param {string} catID Category ID
   * @returns {Promise<Thread[]>}
   */
  public async getByCategory(catID: string): Promise<Thread[]> {
    const client = await this.getClient();

    try {
      const res = await client.query(
        `SELECT *
         FROM modmail.threads
         WHERE category = $1
         ORDER BY id DESC;`,
        [catID],
      );

      return res.rows.map((data) => ThreadsTable.parse(data));
    } finally {
      client.release();
    }
  }

  /**
   * Get a single thread by ID
   * @param {string} threadID
   * @returns {Promise<Thread | null>}
   */
  public async getByID(threadID: string): Promise<Thread | null> {
    const client = await this.getClient();

    try {
      const res = await client.query(
        `SELECT *
         FROM modmail.threads
         WHERE id = $1;`,
        [threadID],
      );

      if (res.rowCount === 0) {
        return null;
      }

      return ThreadsTable.parse(res.rows[0]);
    } finally {
      client.release();
    }
  }

  public async forward(
    threadID: string,
    categoryID: string,
    channelID: string,
  ): Promise<boolean> {
    const client = await this.getClient();

    try {
      const res = await client.query(
        `UPDATE modmail.threads SET category = $2, channel = $3 WHERE id = $1`,
        [threadID, categoryID, channelID],
      );

      return res.rowCount > 0;
    } finally {
      client.release();
    }
  }

  /**
   * Initialize threads table
   */
  protected async init(): Promise<void> {
    const client = await this.getClient();

    try {
      await client.query(
        `CREATE TABLE IF NOT EXISTS modmail.threads
         (
             id        BIGINT               NOT NULL
                 CONSTRAINT threads_pk PRIMARY KEY,
             author    BIGINT               NOT NULL
                 CONSTRAINT threads_users_id_fk
                     REFERENCES modmail.users,
             channel   BIGINT               NOT NULL,
             is_active BOOLEAN DEFAULT true NOT NULL,
             category  BIGINT               NOT NULL
                 CONSTRAINT threads_categories_id_fk
                     REFERENCES modmail.categories
         );`,
      );

      await client.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS threads_channel_uindex ON modmail.threads (channel);`,
      );

      await client.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS threads_channel_uindex_2 ON modmail.threads (channel);`,
      );

      await client.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS threads_id_uindex ON modmail.threads (id);`,
      ); 
    } finally {
      client.release();
    }
  }

  protected async migrate(): Promise<void> {
    const client = await this.getClient();

    try {
      // Add is_admin_only column
      await client.query(
        `ALTER TABLE modmail.threads
            ADD COLUMN IF NOT EXISTS is_admin_only boolean DEFAULT false NOT NULL`,
      );
    } finally {
      client.release();
    }
  }

  private static parse(data: DBThread): Thread {
    return {
      author: { id: data.author },
      channel: data.channel.toString(),
      id: data.id.toString(),
      isAdminOnly: data.is_admin_only,
      isActive: data.is_active,
      messages: [],
      category: data.category.toString(),
    };
  }
}
