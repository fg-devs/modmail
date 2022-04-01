import { Mute, Prisma } from '@prisma/client';
import Table from '../table';

export default class MutesTable extends Table {
  constructor() {
    super('mutes');
  }

  /**
   * Mute a user for a category
   * @param {MuteStatus} mute
   * @returns {Promise<boolean>}
   */
  public async add(mute: Prisma.MuteUncheckedCreateInput): Promise<boolean> {
    const isMuted = await this.isMuted(mute.userId, mute.categoryId);

    if (isMuted) {
      return false;
    }

    const client = this.getClient();
    const newMute = await client.mute.create({
      data: {
        reason: mute.reason,
        till: mute.till,
        user: {
          connectOrCreate: {
            create: { id: mute.userId },
            where: { id: mute.userId },
          },
        },
        category: {
          connect: {
            id: mute.categoryId,
          },
        },
      },
    });

    return newMute !== null;
  }

  /**
   * Unmute a user
   * @param {string} userId
   * @param {string} categoryId
   * @returns {Promise<boolean>}
   */
  public async delete(userId: string, categoryId: string): Promise<boolean> {
    const client = this.getClient();
    const mute = await client.mute.findFirst({
      where: {
        categoryId,
        userId,
      },
      select: {
        id: true,
      },
    });
    if (mute === null) {
      return false;
    }
    await client.mute.delete({
      where: {
        id: mute.id,
      },
    });
    return true;
  }

  /**
   * Get all the mutes for a user
   * @param {string} userId
   * @returns {Promise<MuteStatus>}
   */
  public fetchAll(userId: string): Promise<Mute[]> {
    const client = this.getClient();
    return client.mute.findMany({
      where: {
        userId,
      },
    });
  }

  /**
   * Get a muted user for a given category
   * @param {string} userId
   * @param {string} categoryId
   * @returns {Promise<Mute | null>}
   */
  public fetch(userId: string, categoryId: string): Promise<Mute | null> {
    const client = this.getClient();
    const now = Date.now();
    return client.mute.findFirst({
      where: {
        userId,
        categoryId,
        till: {
          gt: now.toString(),
        },
      },
    });
  }

  /**
   * Check if a given user is a muted for a category
   * @param {string} user
   * @param {string} category
   * @returns {Promise<boolean>}
   */
  public async isMuted(user: string, category: string): Promise<boolean> {
    const muteStatus = await this.fetch(user, category);

    return muteStatus !== null;
  }

  /**
   * Unmute a user from a category
   * @param {string} userId
   * @param {string} categoryId
   * @returns {Promise<boolean>}
   */
  public async remove(userId: string, categoryId: string): Promise<boolean> {
    const client = this.getClient();
    const current = await client.mute.findFirst({
      where: { userId, categoryId },
      select: { id: true },
    });
    if (current === null) {
      return false;
    }
    await client.mute.delete({ where: { id: current.id } });
    return true;
  }
}
