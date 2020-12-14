import { SnowflakeUtil } from 'discord.js';
import { IThreadManager } from '../models/interfaces';
import Table from './table';
import { CategoryID, DiscordID } from '../models/identifiers';
import { Message, Thread } from '../models/types';

export default class ThreadManager extends Table implements IThreadManager {
  public async close(channelID: string): Promise<void> {
    await this.pool.query('UPDATE modmail.threads SET is_active = false WHERE channel = $1', [channelID]);
  }

  public async open(author: string, channelID: string, categoryID: CategoryID): Promise<void> {
    const threadID = SnowflakeUtil.generate(Date.now());
    await this.pool.query('INSERT INTO modmail.threads (id, author, channel, category) VALUES ($1, $2, $3, $4)',
      [threadID, author, channelID, categoryID]);
  }

  public async countThreads(user: string): Promise<number> {
    const res = await this.pool.query(
      'SELECT COUNT(*) FROM modmail.threads WHERE author = $1 AND is_active = false',
      [user],
    );
    return res.rows[0].count;
  }

  public async getCurrentThread(user: DiscordID): Promise<Thread | undefined> {
    const res = await this.pool.query(
      'SELECT * FROM modmail.threads WHERE author = $1 AND is_active = true LIMIT 1',
      [user],
    );
    if (res.rowCount === 0) {
      return undefined;
    }
    const row = res.rows[0];

    return {
      author: { id: row.author },
      channel: row.channel,
      id: row.id,
      isActive: row.is_active,
      messages: [],
      category: row.category,
    };
  }

  public async getThreadByChannel(channelID: DiscordID): Promise<Thread | undefined> {
    const res = await this.pool.query(
      'SELECT * FROM modmail.threads WHERE channel = $1 AND is_active = true LIMIT 1',
      [channelID],
    );
    if (res.rowCount === 0) {
      return undefined;
    }
    const row = res.rows[0];

    return {
      author: { id: row.author },
      channel: row.channel,
      id: row.id,
      isActive: row.is_active,
      messages: [],
      category: row.category,
    };
  }
}
