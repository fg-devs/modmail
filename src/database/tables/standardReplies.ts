import { StandardReply } from '@prisma/client';
import Table from '../table';

export default class StandardRepliesTable extends Table {
  constructor() {
    super('standard_replies');
  }

  /**
   * Create a new standard reply
   * @param name
   * @param reply
   */
  public async create(name: string, reply: string): Promise<void> {
    const client = this.getClient();
    await client.standardReply.create({
      data: {
        name: name.toLowerCase(),
        reply,
      },
    });
  }

  /**
   * Remove a standard reply
   * @param {string} name
   */
  public async remove(name: string): Promise<void> {
    const client = this.getClient();
    await client.standardReply.delete({
      where: {
        name,
      },
    });
  }

  /**
   * Update a standard reply
   * @param {string} name
   * @param {string} reply
   */
  public async update(name: string, reply: string): Promise<void> {
    const client = this.getClient();
    await client.standardReply.update({
      where: { name },
      data: { reply },
    });
  }

  /**
   * Get a standard reply
   * @param {string} name
   * @return {StandardReply | null}
   */
  public fetch(name: string): Promise<StandardReply | null> {
    const client = this.getClient();
    return client.standardReply.findFirst({
      where: { name },
    });
  }

  public async fetchAll(): Promise<StandardReply[]> {
    const client = this.getClient();
    return client.standardReply.findMany();
  }
}
