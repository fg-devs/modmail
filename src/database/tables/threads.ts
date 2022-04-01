import { Prisma, Thread } from '@prisma/client';
import { SnowflakeUtil } from 'discord.js';
import Table from '../table';

export default class ThreadsTable extends Table {
  constructor() {
    super('threads');
  }

  public async participants(threadId: string): Promise<string[]> {
    const client = this.getClient();
    const messages = await client.message.findMany({
      distinct: ['senderId'],
      where: { threadId },
    });
    return messages.map((msg) => msg.senderId);
  }

  public async history(
    userId: string,
    catId: string | null = null,
  ): Promise<Thread[]> {
    const client = this.getClient();
    const threadsRes = await client.message.findMany({
      where: { senderId: userId },
      distinct: ['threadId'],
    });
    const threadIds = threadsRes.map((th) => th.id);
    const where: Prisma.ThreadWhereInput = { id: { in: threadIds } };
    if (catId) {
      where.categoryId = catId;
    }
    const threads = await client.thread.findMany({ where });
    return threads;
  }

  /**
   * Mark a thread a closed
   * @method close
   * @param {string} threadId
   * @returns {Promise<boolean>}
   */
  public async close(threadId: string): Promise<boolean> {
    const client = this.getClient();
    const thread = await client.thread.update({
      data: { isActive: false },
      where: {
        id: threadId,
      },
    });
    return thread !== null;
  }

  /**
   * @param {string} author
   * @param {string} channelID
   * @param {string} categoryID
   * @param {boolean} isAdminOnly
   * @returns {Promise<Thread>}
   */
  public async open(
    author: string,
    channelId: string,
    categoryId: string,
    isAdminOnly: boolean,
  ): Promise<Thread> {
    const client = this.getClient();
    const threadId = SnowflakeUtil.generate(Date.now());
    const thread = await client.thread.create({
      data: {
        id: threadId,
        authorId: author,
        channelId,
        categoryId,
        isAdminOnly,
      },
    });
    return thread;
  }

  /**
   * Count the number of past threads for a user
   * @param {string} user
   * @returns {Promise<number>}
   */
  public countUser(user: string): Promise<number> {
    const client = this.getClient();
    return client.thread.count({
      where: {
        authorId: user,
        isActive: false,
      },
    });
  }

  public countCategory(categoryId: string): Promise<number> {
    const client = this.getClient();
    return client.thread.count({
      where: {
        isActive: true,
        categoryId,
      },
    });
  }

  public getByUser(userId: string): Promise<Thread | null> {
    const client = this.getClient();
    return client.thread.findFirst({
      where: {
        authorId: userId,
      },
    });
  }

  /**
   * @param {string} userId
   * @returns {Promise<Thread | null>} if thread was found
   */
  public getCurrentThread(userId: string): Promise<Thread | null> {
    const client = this.getClient();
    return client.thread.findFirst({
      where: {
        authorId: userId,
        isActive: true,
      },
    });
  }

  /**
   * @param {string} channelId
   * @returns {Promise<Thread | null>}
   */
  public getByChannel(channelId: string): Promise<Thread | null> {
    const client = this.getClient();
    return client.thread.findFirst({
      where: {
        channelId,
        isActive: true,
      },
    });
  }

  /**
   * Get all threads by category ID
   * @param {string} catId Category ID
   * @returns {Promise<Thread[]>}
   */
  public async getByCategory(catId: string): Promise<Thread[]> {
    const client = this.getClient();
    return client.thread.findMany({
      where: {
        categoryId: catId,
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  /**
   * Get a single thread by ID
   * @param {string} threadId
   * @returns {Promise<Thread | null>}
   */
  public getById(threadId: string): Promise<Thread | null> {
    const client = this.getClient();
    return client.thread.findFirst({
      where: { id: threadId },
    });
  }

  public async forward(
    threadId: string,
    categoryId: string,
    channelId: string,
  ): Promise<boolean> {
    const client = this.getClient();
    const thread = client.thread.update({
      data: {
        categoryId,
        channelId,
      },
      where: {
        id: threadId,
      },
    });
    return thread !== null;
  }
}
