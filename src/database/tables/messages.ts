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
      data: {
        content: message.content,
        modmailId: message.modmailId,
        clientId: message.clientId,
        isDeleted: false,
        isInternal: message.isInternal,
        thread: {
          connect: {
            id: message.threadId,
          },
        },
        sender: {
          connectOrCreate: {
            create: { id: message.senderId },
            where: { id: message.senderId },
          },
        },
      },
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
    const message = await client.message.update({
      data: {
        isDeleted: true,
      },
      where: {
        modmailId: id,
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
    return client.message.findFirst({ where: { modmailId: id } });
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
    await client.message.update({
      data: {
        modmailId: newId,
      },
      where: {
        modmailId: oldId,
      },
    });
  }
}
