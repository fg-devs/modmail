import { Attachment, FileType } from '@newcircuit/modmail-types';
import { SnowflakeUtil } from 'discord.js';
import { Pool } from 'pg';
import Table from '../models/table';
import { CreateAttachmentOpt, DBAttachment } from '../models/types';

export default class AttachmentsTable extends Table {
  constructor(pool: Pool) {
    super(pool, 'attachments');
  }

  public async create(opt: CreateAttachmentOpt): Promise<Attachment> {
    const client = await this.getClient();
    const id = SnowflakeUtil.generate(Date.now());
    const type = opt.type === FileType.Image ? 'image' : 'file';
    await client.query(
      `INSERT INTO modmail.attachments (id, message_id, name, source, sender, type)
       VALUES ($1, $2, $3, $4, $5, $6);`,
      [id, opt.messageID, opt.name, opt.source, opt.sender, type],
    );

    return {
      ...opt,
      id,
    };
  }

  public async fetch(msgID: string): Promise<Attachment[]> {
    const client = await this.getClient();
    const res = await client.query(
      `SELECT *
       FROM modmail.attachments
       WHERE message_id = $1`,
      [msgID],
    );

    return res.rows.map((a: DBAttachment) => AttachmentsTable.parse(a));
  }

  private static parse(data: DBAttachment): Attachment {
    return {
      messageID: data.message_id.toString(),
      id: data.id.toString(),
      name: data.name,
      sender: data.sender.toString(),
      source: data.source,
      type: data.type === 'image' ? FileType.Image : FileType.File,
    };
  }

  /**
   * Initialize attachments table
   */
  protected async init(): Promise<void> {
    const client = await this.getClient();
    await client.query(
      `CREATE TABLE IF NOT EXISTS modmail.attachments
       (
           id         BIGINT                                                NOT NULL
           CONSTRAINT attachments_pk PRIMARY KEY,
           message_id BIGINT                                                NOT NULL
           CONSTRAINT attachments_messages_modmail_id_fk
           REFERENCES modmail.messages (modmail_id),
          name       TEXT                                                  NOT NULL,
          source     TEXT                                                  NOT NULL,
          sender     BIGINT                                                NOT NULL
          CONSTRAINT attachments_users_id_fk
          REFERENCES modmail.users,
          type       modmail.file_type DEFAULT 'file' :: modmail.file_type NOT NULL
          );
      `,
    );

    await client.query(
      `CREATE
      UNIQUE INDEX IF NOT EXISTS attachments_id_uindex ON modmail.attachments (id);`,
    );
  }
}
