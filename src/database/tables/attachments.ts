import { Attachment } from '@prisma/client';
import { SnowflakeUtil } from 'discord.js';
import Table from '../table';
import { CreateAttachmentOpt } from '../types';

export default class AttachmentsTable extends Table {
  constructor() {
    super('attachments');
  }

  public async create(opt: CreateAttachmentOpt): Promise<Attachment> {
    const client = await this.getClient();
    const id = SnowflakeUtil.generate(Date.now());
    const attachment = await client.attachment.create({
      data: {
        sender: {
          connectOrCreate: {
            create: {
              id: opt.sender,
            },
            where: {
              id: opt.sender,
            },
          },
        },
        message: {
          connect: {
            id: opt.messageID,
          },
        },
        id,
        name: opt.name,
        source: opt.source,
        type: opt.type,
      },
    });

    return attachment;
  }

  public async fetch(msgId: string): Promise<Attachment[]> {
    const client = await this.getClient();
    const attachments = await client.attachment.findMany({
      where: {
        messageId: msgId,
      },
    });
    return attachments;
  }
}
