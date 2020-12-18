import { SnowflakeUtil } from 'discord.js';
import Table from './table';
import { ICategoryManger } from '../models/interfaces';
import { CategoryID } from '../models/identifiers';
import { CONFIG } from '../globals';
import {
  Category,
  CategoryResolvable,
  CreateCategoryOpt,
  DBCategory,
} from '../models/types';

const TABLE = `${CONFIG.database.schema}.categories`;

export default class CategoryManager extends Table implements ICategoryManger {
  /**
   * @method create
   * @param {CreateCategoryOpt} opt Required options for a new category
   * @returns {Promise<Category>}
   * @throws {Error} A Postgres-related error, mostly from constraint issues.
   */
  public async create(opt: CreateCategoryOpt): Promise<Category> {
    const categoryID = SnowflakeUtil.generate(Date.now());
    const {
      name, guildID, emote, channelID,
    } = opt;
    await this.pool.query(
      `INSERT INTO ${TABLE} (id, name, guild_id, emote, channel_id)`
      + ' VALUES ($1, $2, $3, $4, $5)',
      [categoryID, name, guildID, emote, channelID],
    );

    return {
      channelID,
      emojiID: emote,
      guildID,
      id: categoryID,
      isActive: true,
      name,
    };
  }

  /**
   * Set the activity of a category based on a provided emote.
   * @param {string} emoji
   * @param {boolean} active
   * @returns {Promise<void>}
   * @throws {Error} if nothing was updated
   */
  public async setActive(id: string, active: boolean): Promise<void> {
    const res = await this.pool.query(
      `UPDATE ${TABLE} SET is_active=$2 WHERE id=$1`,
      [id, active],
    );

    if (res.rowCount === 0) {
      throw new Error('Nothing was updated');
    }
  }

  /**
   * Set a unique emote for a given category.
   * @param {CategoryID} id Category identifier
   * @param {string} emote New unique emote
   * @returns {Promise<void>}
   * @throws {Error} If nothing was updated
   */
  public async setEmote(id: CategoryID, emote: string): Promise<void> {
    const res = await this.pool.query(
      `UPDATE ${TABLE} SET emote = $1 WHERE id = $2`,
      [emote, id],
    );

    if (res.rowCount === 0) {
      throw new Error('Nothing was updated');
    }
  }

  /**
   * Set a unique name for a given category.
   * @param {CategoryID} id Targetted category
   * @param {string} name A new unique name
   * @returns {Promise<void>}
   * @throws {Error} If nothing was updated
   */
  public async setName(id: CategoryID, name: string): Promise<void> {
    const res = await this.pool.query(
      `UPDATE ${TABLE} SET name = $1 WHERE id = $2`,
      [name, id],
    );

    if (res.rowCount === 0) {
      throw new Error('Nothing was updated');
    }
  }

  /**
   * @method fetchAll
   * @param {CategoryResolvable} by
   * @param {string} id
   * @returns {Promise<Category[]>}
   * @throws {Error} If nothing is resolved
   */
  public async fetchAll(by: CategoryResolvable, id: string): Promise<Category[]> {
    const target = CategoryManager.resolve(by);
    let parsed: null | boolean = null;

    if (by === CategoryResolvable.activity) {
      parsed = id === 'true';
    }

    const res = await this.pool.query(
      `SELECT * FROM ${TABLE} WHERE ${target} = $1`,
      [parsed || id],
    );

    if (res.rowCount === 0) {
      return [];
    }

    return res.rows.map(CategoryManager.parse);
  }

  /**
   * @method fetch
   * @param {CategoryResolvable} by
   * @param {string} id
   * @throws {Error} If nothing is resolved
   */
  public async fetch(by: CategoryResolvable, id: string): Promise<Category> {
    const res = await this.fetchAll(by, id);

    if (res.length === 0) {
      throw new Error(`${id} didn't resolve anything`);
    }

    return res[0];
  }

  /**
   * @param {CategoryResolvable} resolvable
   * @returns {string}
   */
  private static resolve(resolvable: CategoryResolvable): string {
    switch (resolvable) {
      case CategoryResolvable.name:
        return 'name';
      case CategoryResolvable.channel:
        return 'channel_id';
      case CategoryResolvable.emote:
        return 'emote';
      case CategoryResolvable.activity:
        return 'is_active';
      case CategoryResolvable.id:
        return 'id';
      case CategoryResolvable.guild:
        return 'guild_id';
      default:
        throw new Error('An invalid resolvable was provided.');
    }
  }

  /**
   * @method parse
   * @param {DBCatergory} data
   * @returns {Category}
   */
  private static parse(data: DBCategory): Category {
    return {
      channelID: data.channel_id,
      emojiID: data.emote,
      guildID: data.guild_id,
      id: data.id,
      isActive: true,
      name: data.name,
    };
  }
}
