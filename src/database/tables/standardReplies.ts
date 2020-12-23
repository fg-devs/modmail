import { SnowflakeUtil } from 'discord.js';
import Table from '../table';
import { IStandardReplyManager } from '../../models/interfaces';
import { CreateStandardReplyOpt, DBStandardReply, StandardReply } from '../../models/types';
import { CONFIG } from '../../globals';

const TABLE = `${CONFIG.database.schema}.standard_replies`;

export default class StandardReplyManager extends Table implements IStandardReplyManager {
  /**
   * Create a new standard reply
   * @param {string} opt
   */
  public async create(opt: CreateStandardReplyOpt): Promise<void> {
    const id = SnowflakeUtil.generate(Date.now());
    await this.pool.query(
      `INSERT INTO ${TABLE} (id, name, reply) VALUES ($1::bigint, $2, $3)`,
      [id, opt.name, opt.reply],
    );
  }

  /**
   * Remove a standard reply
   * @param {string} name
   */
  public async remove(name: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM ${TABLE} WHERE name = $1`,
      [name],
    );
  }

  /**
   * Update a standard reply
   * @param {string} opt
   * @param {string} id
   */
  public async update(opt: CreateStandardReplyOpt, id: string): Promise<void> {
    await this.pool.query(
      `UPDATE ${TABLE} SET reply = $1, name = $2 WHERE id = $3::bigint OR name = $3`,
      [opt.reply, opt.name, id],
    );
  }

  /**
   * Get a standard reply
   * @param name
   * @return {StandardReply | null}
   */
  public async get(name: string): Promise<StandardReply | null> {
    const res = await this.pool.query(
      `SELECT * FROM ${TABLE} WHERE name = $1`,
      [name.toLowerCase()],
    );
    if (res.rowCount === 0) {
      return null;
    }
    return StandardReplyManager.parse(res.rows[0]);
  }

  /**
   * Parse a db result into StandardReply
   * @param row
   * @return {StandardReply}
   */
  private static parse(row: DBStandardReply): StandardReply {
    return {
      id: row.id.toString(),
      name: row.name,
      reply: row.reply,
    };
  }
}
