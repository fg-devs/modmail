import { Message, Prisma } from '@prisma/client';
import Table from '../table';

export default class MessagesTable extends Table {
  constructor() {
    super('messages');
  }

  /**
   * Log a message
   * @method add
   * @param {Message} message
   * @returns {Promise<Message>}
   */
  public add(message: Prisma.MessageUncheckedCreateInput): Promise<Message> {
    const client = this.getClient();
    return client.message.create({
      data: message,
    });
  }

  /**
   * Get the last message of a thread
   * @param {string} threadId
   * @param {string} author
   * @returns {Promise<Message | null>}
   */
  public getLastMessage(threadId: string, author: string): Promise<Message | null> {
    const client = this.getClient();
    return client.message.findFirst({
      where: {
        senderId: author,
        threadId,
        isDeleted: false,
        isInternal: false,
      },
      orderBy: {
        modmailId: 'desc',
      },
    });
  }

  /**
   * Set a message to deleted
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  public async setDeleted(id: string): Promise<boolean> {
    const client = this.getClient();
    const old = await client.message.findFirst({
      where: {
        modmailId: id,
        OR: {
          clientId: id,
        },
      },
      select: {
        id: true,
      },
    });
    if (old === null) {
      return false;
    }

    const message = await client.message.update({
      data: {
        isDeleted: true,
      },
      where: {
        id: old.id,
      },
    });
    return message !== null;
  }

  /**
   * @method fetch
   * @param {string} id
   * @returns {Promise<Message | null>}
   */
  public fetch(id: string): Promise<Message | null> {
    const client = this.getClient();
    return client.message.findFirst({ where: { id } });
  }

  public fetchAll(threadId: string): Promise<Message[]> {
    const client = this.getClient();
    return client.message.findMany({
      where: {
        threadId,
      },
      orderBy: {
        modmailId: 'asc',
      },
    });
  }

  public async fetchLast(threadId: string): Promise<Message | null> {
    const client = this.getClient();
    return client.message.findFirst({
      where: {
        threadId,
      },
      orderBy: {
        modmailId: 'desc',
      },
    });
  }

  public getPastMessages(threadId: string): Promise<Message[]> {
    const client = this.getClient();
    return client.message.findMany({
      where: {
        threadId,
        isDeleted: false,
      },
    });
  }

  public async update(oldId: string, newId: string): Promise<void> {
    const client = this.getClient();
    const original = await client.message.findFirst({
      where: {
        modmailId: oldId,
      },
      select: { id: true },
    });
    if (original === null) {
      return;
    }
    await client.message.update({
      data: {
        modmailId: newId,
      },
      where: {
        id: original.id,
      },
    });
  }
}
