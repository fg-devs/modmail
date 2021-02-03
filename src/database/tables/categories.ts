import {
  Category,
  DBCategory,
} from 'modmail-types';
import { PoolClient } from 'pg';
import { SnowflakeUtil } from 'discord.js';
import Table from '../../models/table';
import {
  CategoryResolvable,
  CreateCategoryOpt,
} from '../../models/types';
import Modmail from '../../Modmail';

export default class CategoryManager extends Table {
  constructor(modmail: Modmail, pool: PoolClient) {
    super(modmail, pool, 'categories');
  }

  /**
   * Handles added attachments and sends them.
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
      `INSERT INTO ${this.name} (id, name, guild_id, emote, channel_id)`
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

  public async setActive(id: string, active: boolean): Promise<boolean> {
    const res = await this.pool.query(
      `UPDATE ${this.name} SET is_active=$2 WHERE id=$1`,
      [id, active],
    );

    return res.rowCount > 0;
  }

  public async setEmote(id: string, emote: string): Promise<boolean> {
    const res = await this.pool.query(
      `UPDATE ${this.name} SET emote = $1 WHERE id = $2`,
      [emote, id],
    );

    return res.rowCount > 0;
  }

  /**
   * Set a unique name for a given category.
   * @param {string} id Targetted category
   * @param {string} name A new unique name
   * @returns {Promise<void>}
   * @throws {Error} If nothing was updated
   */
  public async setName(id: string, name: string): Promise<void> {
    const res = await this.pool.query(
      `UPDATE ${this.name} SET name = $1 WHERE id = $2`,
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
      `SELECT * FROM ${this.name} WHERE ${target} = $1`,
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
  public async fetch(by: CategoryResolvable, id: string): Promise<Category | null> {
    const res = await this.fetchAll(by, id);

    if (res.length === 0) {
      return null;
    }

    return res[0];
  }

  /**
   * Initialize the categories table if it doesn't exist
   */
  protected async init(): Promise<void> {
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS ${this.name} (`
      + ' id bigint not null constraint categories_pk primary key,'
      + ' channel_id bigint unique not null,'
      + ' name text not null,'
      + ' is_active boolean default true not null,'
      + ' guild_id bigint not null,'
      + ' emote text not null)',
    );

    await this.pool.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS categories_emote_uindex ON ${this.name} (emote);`,
    );

    await this.pool.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS categories_id_uindex ON ${this.name} (id);`,
    );

    await this.pool.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS categories_name_uindex ON ${this.name} (name);`,
    );
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
      channelID: data.channel_id.toString(),
      emojiID: data.emote,
      guildID: data.guild_id.toString(),
      id: data.id.toString(),
      isActive: true,
      name: data.name,
    };
  }
}
