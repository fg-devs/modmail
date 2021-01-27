import { DBThread, Thread } from 'modmail-types';
import { SnowflakeUtil } from 'discord.js';
import { PoolClient } from 'pg';
import Table from '../../models/table';
import Modmail from '../../Modmail';

export default class ThreadManager extends Table {
  constructor(modmail: Modmail, pool: PoolClient) {
    super(modmail, pool, 'threads');
  }

  /**
   * Mark a thread a closed
   * @method close
   * @param {string} id
   * @returns {Promise<void>}
   * @throws {Error} If nothign is updated
   */
  public async close(id: string): Promise<void> {
    const res = await this.pool.query(
      `UPDATE ${this.name} SET is_active = false WHERE channel = $1`,
      [id],
    );

    if (res.rowCount === 0) {
      throw new Error('Nothing was updated');
    }
  }

  /**
   * @method open
   * @param {string} author
   * @param {string} channelID
   * @param {string} categoryID
   * @returns {Promise<Thread>}
   */
  public async open(
    author: string,
    channelID: string,
    categoryID: string,
  ): Promise<Thread> {
    const threadID = SnowflakeUtil.generate(Date.now());
    await this.pool.query(
      `INSERT INTO ${this.name} (id, author, channel, category)`
      + ' VALUES ($1, $2, $3, $4)',
      [threadID, author, channelID, categoryID],
    );

    return {
      author: {
        id: author,
      },
      channel: channelID,
      category: categoryID,
      id: threadID,
      isActive: true,
      messages: [],
    };
  }

  /**
   * Count the number of active threads for a user
   * @method countThreads
   * @param {string} user
   * @returns {Promise<number>}
   */
  public async countThreads(user: string): Promise<number> {
    const res = await this.pool.query(
      `SELECT COUNT(*) FROM ${this.name} WHERE author = $1 AND is_active = false`,
      [user],
    );

    return res.rows[0].count;
  }

  /**
   * @param {string} user
   * @returns {Promise<Thread | null>} if thread was found
   */
  public async getCurrentThread(user: string): Promise<Thread | null> {
    const res = await this.pool.query(
      `SELECT * FROM ${this.name} WHERE author = $1 AND is_active = true LIMIT 1`,
      [user],
    );
    if (res.rowCount === 0) {
      return null;
    }

    return ThreadManager.parse(res.rows[0]);
  }

  /**
   * @method getThreadByChannel
   * @param {string} channelID
   * @returns {Promise<Thread>}
   * @throws {Error} if nothing was resolved
   */
  public async getThreadByChannel(channelID: string): Promise<Thread | null> {
    const res = await this.pool.query(
      `SELECT * FROM ${this.name} WHERE channel = $1 AND is_active = true LIMIT 1`,
      [channelID],
    );

    if (res.rowCount === 0) {
      return null;
    }

    return ThreadManager.parse(res.rows[0]);
  }

  /**
   * Count the amount of active threads for a category
   * @param {string} categoryID
   * @returns {Promise<number>}
   */
  public async countCategoryThreads(categoryID: string): Promise<number> {
    const res = await this.pool.query(
      `SELECT COUNT(*) FROM ${this.name}`
      + ' WHERE is_active=true'
      + ' AND category=$1',
      [categoryID],
    );

    return res.rows[0].count;
  }

  /**
   * Initialize threads table
   */
  protected async init(): Promise<void> {
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS ${this.name} (`
      + ' id bigint not null'
      + '   constraint threads_pk primary key,'
      + ' author bigint not null'
      + '   constraint threads_users_id_fk'
      + '   references modmail.users,'
      + ' channel bigint not null,'
      + ' is_active boolean default true not null,'
      + ' category bigint not null'
      + '   constraint threads_categories_id_fk'
      + '   references modmail.categories);',
    );

    await this.pool.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS threads_channel_uindex ON ${this.name} (channel);`,
    );

    await this.pool.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS threads_channel_uindex_2 ON ${this.name} (channel);`,
    );

    await this.pool.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS threads_id_uindex ON ${this.name} (id);`,
    );
  }

  private static parse(data: DBThread): Thread {
    return {
      author: { id: data.author },
      channel: data.channel.toString(),
      id: data.id.toString(),
      isActive: data.is_active,
      messages: [],
      category: data.category.toString(),
    };
  }

  public async updateThread(
    threadID: string,
    channelID: string,
    categoryID: string,
  ): Promise<void> {
    await this.pool.query(
      'UPDATE modmail.threads SET channel = $1, category = $2 WHERE id = $3',
      [channelID, categoryID, threadID],
    );
  }
}
