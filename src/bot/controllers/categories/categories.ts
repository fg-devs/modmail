import { Category as PartialCategory } from '@newcircuit/modmail-types';
import {
  CategoryChannel, Guild,
} from 'discord.js';
import ModmailBot from '../../bot';
import Category from './category';

export type CatSelector = {
  category: CategoryChannel,
  guild: Guild,
  id: string,
  name: string,
}

export default class CatController {
  private readonly modmail: ModmailBot;

  constructor(modmail: ModmailBot) {
    this.modmail = modmail;
  }

  public async create(
    catChan: CategoryChannel,
    emoji: string,
    name: string,
    isPrivate: boolean,
    desc: string,
  ): Promise<Category> {
    const pool = ModmailBot.getDB();

    const data = await pool.categories.create({
      guildID: catChan.guild.id,
      name,
      description: desc,
      emoji,
      isPrivate,
      channelID: catChan.id,
    });

    return new Category(this.modmail, data);
  }

  public async getByEmoji(emoji: string): Promise<Category | null> {
    const pool = ModmailBot.getDB();
    const data = await pool.categories.fetchByEmoji(emoji);

    if (data === null) {
      return null;
    }

    return new Category(this.modmail, data);
  }

  public async getByGuild(guildID: string): Promise<Category | null> {
    const pool = ModmailBot.getDB();
    const data = await pool.categories.fetchByGuild(guildID);

    if (data === null) {
      return null;
    }

    return new Category(this.modmail, data);
  }

  public async getByID(catID: string): Promise<Category | null> {
    const pool = ModmailBot.getDB();
    const data = await pool.categories.fetchByID(catID);

    if (data === null) {
      return null;
    }

    return new Category(this.modmail, data);
  }

  public async getAll(
    onlyActive = true,
    privateCats = false,
  ): Promise<Category[]> {
    const pool = ModmailBot.getDB();
    const cats = await pool.categories.fetchAll(onlyActive);

    return cats.map(
      (data: PartialCategory) => new Category(this.modmail, data),
    ).filter((cat: Category) => {
      const isPriv = cat.isPrivate();
      return privateCats || (!privateCats && !isPriv);
    });
  }

  /**
   * List roles of a member in a mention list fashion (see returns).
   * @param {Category[]} categories
   * @returns {string} "category = 👍"
   */
  public static listCategories(categories: Category[]): string {
    let res = '';
    for (let i = 0; i < categories.length; i += 1) {
      const category = categories[i];
      res += `${category.getName()} = ${category.getEmoji()}\n`;
    }

    return res;
  }
}
