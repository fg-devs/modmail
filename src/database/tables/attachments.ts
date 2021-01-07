import { FileType } from 'modmail-types';
import { SnowflakeUtil } from 'discord.js';
import { PoolClient } from 'pg';
import Table from '../../models/table';
import { CreateAttachmentOpt } from '../../models/types';
import Modmail from '../../Modmail';

export default class Attachments extends Table {
  constructor(modmail: Modmail, pool: PoolClient) {
    super(modmail, pool, 'attachments');
  }

  /**
  * @param {CreateAttachmentOpt} opt
  */
  public async create(opt: CreateAttachmentOpt): Promise<void> {
    const id = SnowflakeUtil.generate(Date.now());
    const type = opt.type === FileType.Image ? 'image' : 'file';
    await this.pool.query(
      `INSERT INTO ${this.name} `
      + '(id, message_id, name, source, sender, type) '
      + 'VALUES ($1, $2, $3, $4, $5, $6)',
      [id, opt.messageID, opt.name, opt.source, opt.sender, type],
    );
  }

  /**
   * Initialize attachments table
   */
  protected async init(): Promise<void> {
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS ${this.name} (`
      + ' id bigint not null constraint attachments_pk primary key,'
      + ' message_id bigint not null'
      + '   constraint attachments_messages_modmail_id_fk'
      + '   references modmail.messages (modmail_id),'
      + ' name text not null,'
      + ' source text not null,'
      + ' sender bigint not null'
      + '   constraint attachments_users_id_fk'
      + '   references modmail.users,'
      + " type modmail.file_type default 'file' :: modmail.file_type not null)",
    );

    await this.pool.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS attachments_id_uindex ON ${this.name} (id);`,
    );
  }
}
