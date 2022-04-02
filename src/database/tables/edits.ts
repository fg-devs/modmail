import { Edit } from '@prisma/client';
import Table from '../table';

export default class EditsTable extends Table {
  constructor() {
    super('edits');
  }

  public async add(content: string, msgId: string): Promise<Edit> {
    const client = this.getClient();

    const lastVerOpt = await client.edit.findFirst({
      where: {
        messageId: msgId,
      },
      select: {
        version: true,
      },
      orderBy: {
        version: 'desc',
      },
    });
    const lastVersion = lastVerOpt === null
      ? 1
      : lastVerOpt.version + 1;

    return client.edit.create({
      data: {
        content,
        message: {
          connect: { modmailId: msgId },
        },
        version: lastVersion,
      },
    });
  }

  public fetch(msgId: string): Promise<Edit[]> {
    const client = this.getClient();
    return client.edit.findMany({
      where: {
        messageId: msgId,
      },
    });
  }
}
