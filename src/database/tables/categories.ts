import { Category, Prisma } from '@prisma/client';
import { SnowflakeUtil } from 'discord.js';
import Table from '../table';
import {
  CreateCategoryOpt,
} from '../types';

export default class CategoriesTable extends Table {
  constructor() {
    super('categories');
  }

  /**
   * Handles added attachments and sends them.
   * @method create
   * @param {CreateCategoryOpt} opt Required options for a new category
   * @returns {Promise<Category>}
   */
  public async create(opt: CreateCategoryOpt): Promise<Category> {
    const client = this.getClient();
    const categoryID = SnowflakeUtil.generate(Date.now());
    const desc = opt.description || '';
    const isPrivate = opt.isPrivate !== undefined
      ? opt.isPrivate
      : false;
    const category = await client.category.create({
      data: {
        channelId: opt.channelID,
        emoji: opt.emoji,
        guildId: opt.guildID,
        id: categoryID,
        name: opt.name,
        description: desc,
        isActive: true,
        isPrivate,
      },
    });
    return category;
  }

  public deactivate(id: string): Promise<boolean> {
    return this.set(id, {
      isActive: false,
      channelId: null,
    });
  }

  public async reactivate(id: string, channelId: string): Promise<boolean> {
    return this.set(id, {
      isActive: true,
      channelId,
    });
  }

  /**
   * Set a unique emoji for a given category.
   * @param {string} id Category identifier
   * @param {string} emoji New unique emote
   * @returns {Promise<boolean>} Whether or not something changed
   */
  public setEmote(id: string, emoji: string): Promise<boolean> {
    return this.set(id, {
      emoji,
    });
  }

  /**
   * Set a unique name for a given category.
   * @param {string} id Targeted category
   * @param {string} name A new unique name
   * @returns {Promise<boolean>}
   */
  public setName(id: string, name: string): Promise<boolean> {
    return this.set(id, {
      name,
    });
  }

  public setPrivate(id: string, isPrivate: boolean): Promise<boolean> {
    return this.set(id, {
      isPrivate,
    });
  }

  public fetchAll(activeOnly = true): Promise<Category[]> {
    const client = this.getClient();
    const where: Prisma.CategoryWhereInput = activeOnly
      ? { isActive: true }
      : {};

    return client.category.findMany({ where });
  }

  /**
   * @method fetchByID
   * @param {string} id
   * @returns {Promise<Category | null>}
   */
  public fetchByID(id: string): Promise<Category | null> {
    const client = this.getClient();
    return client.category.findFirst({ where: { id } });
  }

  public fetchByEmoji(emoji: string): Promise<Category | null> {
    const client = this.getClient();
    return client.category.findFirst({ where: { emoji } });
  }

  public fetchByGuild(guildId: string): Promise<Category | null> {
    const client = this.getClient();
    return client.category.findFirst({ where: { guildId } });
  }

  public fetchByName(name: string): Promise<Category | null> {
    const client = this.getClient();
    return client.category.findFirst({ where: { name } });
  }

  private async set(id: string, data: Prisma.CategoryUpdateInput): Promise<boolean> {
    const client = this.getClient();
    const category = await client.category.update({
      data,
      where: { id },
    });
    return category !== null;
  }
}
