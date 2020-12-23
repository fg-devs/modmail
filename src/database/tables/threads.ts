import { SnowflakeUtil } from 'discord.js';
import { IThreadManager } from '../../models/interfaces';
import Table from '../table';
import { CategoryID, DiscordID, ThreadID } from '../../models/identifiers';
import { DBThread, Thread } from '../../models/types';
import { CONFIG } from '../../globals';

const TABLE = `${CONFIG.database.schema}.threads`;

export default class ThreadManager extends Table implements IThreadManager {
  /**
   * Mark a thread a closed
   * @method close
   * @param {DiscordID} id
   * @returns {Promise<void>}
   * @throws {Error} If nothign is updated
   */
  public async close(id: DiscordID): Promise<void> {
    const res = await this.pool.query(
      `UPDATE ${TABLE} SET is_active = false WHERE channel = $1`,
      [id],
    );

    if (res.rowCount === 0) {
      throw new Error('Nothing was updated');
    }
  }

  /**
   * @method open
   * @param {DiscordID} author
   * @param {DiscordID} channelID
   * @param {CategoryID} categoryID
   * @returns {Promise<void>}
   * @throws {Error}
   */
  public async open(
    author: DiscordID,
    channelID: DiscordID,
    categoryID: CategoryID,
  ): Promise<void> {
    const threadID = SnowflakeUtil.generate(Date.now());
    await this.pool.query(
      `INSERT INTO ${TABLE} (id, author, channel, category)`
      + ' VALUES ($1, $2, $3, $4)',
      [threadID, author, channelID, categoryID],
    );
  }

  /**
   * Count the number of active threads for a user
   * @method countThreads
   * @param {DiscordID} user
   * @returns {Promise<number>}
   */
  public async countThreads(user: string): Promise<number> {
    const res = await this.pool.query(
      `SELECT COUNT(*) FROM ${TABLE} WHERE author = $1 AND is_active = false`,
      [user],
    );

    return res.rows[0].count;
  }

  /**
   * @param {DiscordID} user
   * @returns {Promise<Thread | null>} if thread was found
   */
  public async getCurrentThread(user: DiscordID): Promise<Thread | null> {
    const res = await this.pool.query(
      `SELECT * FROM ${TABLE} WHERE author = $1 AND is_active = true LIMIT 1`,
      [user],
    );
    if (res.rowCount === 0) {
      return null;
    }

    return ThreadManager.parse(res.rows[0]);
  }

  /**
   * @method getThreadByChannel
   * @param {DiscordID} channelID
   * @returns {Promise<Thread>}
   * @throws {Error} if nothing was resolved
   */
  public async getThreadByChannel(channelID: DiscordID): Promise<Thread | null> {
    const res = await this.pool.query(
      `SELECT * FROM ${TABLE} WHERE channel = $1 AND is_active = true LIMIT 1`,
      [channelID],
    );

    if (res.rowCount === 0) {
      return null;
    }

    return ThreadManager.parse(res.rows[0]);
  }

  private static parse(data: DBThread): Thread {
    return {
      author: { id: data.author },
      channel: data.channel,
      id: data.id,
      isActive: data.is_active,
      messages: [],
      category: data.category,
    };
  }

  public async updateThread(
    threadID: ThreadID,
    channelID: DiscordID,
    categoryID: CategoryID,
  ): Promise<void> {
    await this.pool.query(
      'UPDATE modmail.threads SET channel = $1, category = $2 WHERE id = $3',
      [channelID, categoryID, threadID],
    );
  }
}
