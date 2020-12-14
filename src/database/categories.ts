import { SnowflakeUtil } from 'discord.js';
import Table from './table';
import { ICategoryManger } from '../models/interfaces';
import { DiscordID, ThreadID } from '../models/identifiers';
import { Category } from '../models/types';

export default class CategoryManager extends Table implements ICategoryManger {
  public async create(
    guildID: DiscordID,
    name: string,
    emote: string,
    channelID: DiscordID,
  ): Promise<void> {
    const categoryID = SnowflakeUtil.generate(Date.now());
    await this.pool.query(
      'INSERT INTO modmail.categories (id, name, guild_id, emote, channel_id) VALUES ($1, $2, $3, $4, $6)',
      [categoryID, name, guildID, emote, channelID],
    );
  }

  public async delete(threadID: ThreadID): Promise<void> {
    await this.pool.query('DELETE FROM modmail.categories WHERE id = $1', [threadID]);
  }

  public async setEmoji(threadID: ThreadID, emote: string): Promise<void> {
    await this.pool.query('UPDATE modmail.categories SET emote = $1 WHERE id = $2', [emote, threadID]);
  }

  public async setName(threadID: ThreadID, name: string): Promise<void> {
    await this.pool.query('UPDATE modmail.categories SET name = $1 WHERE id = $2', [name, threadID]);
  }

  public async getActiveCategories(): Promise<Category[]> {
    const res = await this.pool.query('SELECT * FROM modmail.categories WHERE is_active = true');
    const categories: Category[] = [];

    res.rows.forEach((category) => {
      categories.push({
        channelID: category.channel_id,
        emojiID: category.emote,
        guildID: category.guild_id,
        id: category.id,
        isActive: true,
        name: category.name,
      });
    });

    return categories;
  }

  public async getCategoryByEmote(emote: string): Promise<Category | undefined> {
    const res = await this.pool.query(
      'SELECT * FROM modmail.categories WHERE emote = $1 AND is_active = true',
      [emote],
    );

    if (res.rowCount === 0) {
      return undefined;
    }

    const row = res.rows[0];
    return {
      channelID: row.channel_id,
      emojiID: row.emote,
      guildID: row.guild_id,
      id: row.id,
      isActive: true,
      name: row.name,
    };
  }
}
