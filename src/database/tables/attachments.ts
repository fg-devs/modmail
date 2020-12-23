import { SnowflakeUtil } from 'discord.js';
import { IAttachmentManager } from '../../models/interfaces';
import Table from '../table';
import { CreateAttachmentOpt, FileType } from '../../models/types';
import { CONFIG } from '../../globals';

const TABLE = `${CONFIG.database.schema}.attachments`;
export default class AttachmentManager
  extends Table implements IAttachmentManager {
  /**
  * @param {CreateAttachmentOpt} opt
  */
  public async create(opt: CreateAttachmentOpt): Promise<void> {
    const id = SnowflakeUtil.generate(Date.now());
    const type = opt.type === FileType.Image ? 'image' : 'file';
    await this.pool.query(
      `INSERT INTO ${TABLE} `
      + '(id, message_id, name, source, sender, type) '
      + 'VALUES ($1, $2, $3, $4, $5, $6)',
      [id, opt.messageID, opt.name, opt.source, opt.sender, type],
    );
  }
}
