import { Category as PartialCategory } from '@Floor-Gang/modmail-types';
import {
  CategoryChannel, DMChannel, Guild, TextChannel, User,
} from 'discord.js';
import { CommandoMessage } from 'discord.js-commando';
import { CategoryResolvable } from '@Floor-Gang/modmail-database';
import Embeds from '../../util/Embeds';
import { PROMPT_TIME } from '../../globals';
import Modmail from '../../Modmail';
import Category from './category';

export type CatSelector = {
  category: CategoryChannel,
  guild: Guild,
  id: string,
  name: string,
}

export default class CatController {
  private activeSelectors: Set<string> = new Set();

  private readonly modmail: Modmail;

  constructor(modmail: Modmail) {
    this.modmail = modmail;
  }

  public async create(
    catChan: CategoryChannel,
    emoji: string,
    name: string,
    desc: string,
  ): Promise<Category> {
    const pool = Modmail.getDB();

    const data = await pool.categories.create({
      guildID: catChan.guild.id,
      name,
      description: desc,
      emote: emoji,
      channelID: catChan.id,
    });

    return new Category(this.modmail, data);
  }

  public async getByEmoji(
    emoji: string,
    isActive = true,
  ): Promise<Category | null> {
    const pool = Modmail.getDB();
    const data = await pool.categories.fetch(
      CategoryResolvable.emote,
      emoji,
    );

    if (data === null || data.isActive !== isActive) {
      return null;
    }

    return new Category(this.modmail, data);
  }

  /**
   * Get category based on what guild the message is in
   * @param {CommandoMessage} msg
   * @param {boolean} isActive Whether or not the category must be active
   */
  public async getByMessage(
    msg: CommandoMessage,
    isActive = true,
  ): Promise<Category | null> {
    if (!msg.guild) {
      return null;
    }

    const pool = Modmail.getDB();
    const data = await pool.categories.fetch(
      CategoryResolvable.guild,
      msg.guild.id,
    );

    if (data === null || data.isActive !== isActive) {
      return null;
    }

    return new Category(this.modmail, data);
  }

  public async getByID(
    catID: string,
    isActive = true,
  ): Promise<Category | null> {
    const pool = Modmail.getDB();
    const data = await pool.categories.fetch(
      CategoryResolvable.id,
      catID,
    );

    if (data === null || data.isActive !== isActive) {
      return null;
    }

    return new Category(this.modmail, data);
  }

  public async getAll(isActive = true): Promise<Category[]> {
    const pool = Modmail.getDB();
    const cats = await pool.categories.fetchAll(
      CategoryResolvable.activity,
      isActive ? 'true' : 'false',
    );

    return cats.map(
      (data: PartialCategory) => new Category(this.modmail, data),
    );
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

  private hasActiveSelector(user: string): boolean {
    return this.activeSelectors.has(user);
  }

  private remember(user: string): void {
    this.activeSelectors.add(user);
  }

  private forget(user: string): void {
    this.activeSelectors.delete(user);
  }
}
