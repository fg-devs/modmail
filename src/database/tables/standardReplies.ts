import { PoolClient } from 'pg';
import { SnowflakeUtil } from 'discord.js';
import Table from '../../models/table';
import { CreateStandardReplyOpt, DBStandardReply, StandardReply } from '../../models/types';
import Modmail from '../../Modmail';

export default class StandardReplyManager extends Table {
  constructor(modmail: Modmail, pool: PoolClient) {
    super(modmail, pool, 'standard_replies');
  }

  /**
   * Create a new standard reply
   * @param {string} opt
   */
  public async create(opt: CreateStandardReplyOpt): Promise<void> {
    const id = SnowflakeUtil.generate(Date.now());
    await this.pool.query(
      `INSERT INTO ${this.name} (id, name, reply) VALUES ($1::bigint, $2, $3)`,
      [id, opt.name, opt.reply],
    );
  }

  /**
   * Remove a standard reply
   * @param {string} name
   */
  public async remove(name: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM ${this.name} WHERE name = $1`,
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
      `UPDATE ${this.name} SET reply = $1, name = $2 WHERE id = $3::bigint OR name = $3`,
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
      `SELECT * FROM ${this.name} WHERE name = $1`,
      [name.toLowerCase()],
    );
    if (res.rowCount === 0) {
      return null;
    }
    return StandardReplyManager.parse(res.rows[0]);
  }

  /**
   * Initialize standard replies table
   */
  protected async init(): Promise<void> {
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS ${this.name} (`
      + ' id bigint not null'
      + '   constraint standard_replies_pk primary key,'
      + ' name text not null,'
      + ' reply text not null);',
    );

    await this.pool.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS standard_replies_id_uindex ON ${this.name} (id);`,
    );

    await this.pool.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS standard_replies_name_uindex ON ${this.name} (name);`,
    );
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
