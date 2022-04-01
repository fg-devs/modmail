import { Category as PartialCategory } from '@prisma/client';
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

  /**
   * Create a new category with the required attributes provided
   * @param {CategoryChannel} catChan The Discord category channel that we we
   * will be using for this new Modmail category
   * @param {string} emoji The emoji that will uniquely identify this category
   * @param {string} name The category name
   * @param {boolean} isPrivate If a category is private it means only the
   * staff can reach out to the community members
   * @param {string} desc The community description
   */
  public async create(
    catChan: CategoryChannel,
    emoji: string,
    name: string,
    isPrivate: boolean,
    desc: string,
  ): Promise<Category> {
    const pool = ModmailBot.getDB();

    const data = await pool.categories.create({
      // The Discord category "parent channel" that will be utilized
      channelID: catChan.id,
      guildID: catChan.guild.id,
      name,
      description: desc,
      emoji,
      isPrivate,
    });

    return new Category(this.modmail, data);
  }

  /**
   * Get a Modmail category based on a provided emoji
   * @returns {Promise<Category | null>}
   */
  public async getByEmoji(emoji: string): Promise<Category | null> {
    const pool = ModmailBot.getDB();
    const data = await pool.categories.fetchByEmoji(emoji);

    if (data === null) {
      return null;
    }

    return new Category(this.modmail, data);
  }

  /**
   * Get a Modmail category based on a Discord guild ID
   * @returns {Promise<Category | null>}
   */
  public async getByGuild(guildID: string): Promise<Category | null> {
    const pool = ModmailBot.getDB();
    const data = await pool.categories.fetchByGuild(guildID);

    if (data === null) {
      return null;
    }

    return new Category(this.modmail, data);
  }

  /**
   * Get a Modmail category based on it's ID
   * @returns {Promise<Category | null>}
   */
  public async getByID(catID: string): Promise<Category | null> {
    const pool = ModmailBot.getDB();
    const data = await pool.categories.fetchByID(catID);

    if (data === null) {
      return null;
    }

    return new Category(this.modmail, data);
  }

  /**
   * Get all categories, default: active only and no private categories
   * @param {boolean} onlyActive Whether or not to fetch only
   * active categories
   * @param {boolean} privateCats Whether or not to fetch private categories
   * as well.
   */
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
   * @returns {string}
   * @example "category name = 👍\n"
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
