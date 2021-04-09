import {
  Category as PartialCategory,
  MuteStatus,
  Role,
  RoleLevel,
} from '@newcircuit/modmail-types';
import { CategoryChannel, Guild } from 'discord.js';
import { MAX_THREADS } from '../../globals';
import ModmailBot from '../../bot';

export default class Category {
  private readonly data: PartialCategory;

  private readonly modmail: ModmailBot;

  constructor(modmail: ModmailBot, data: PartialCategory) {
    this.modmail = modmail;
    this.data = data;
  }

  public isPrivate(): boolean {
    return this.data.isPrivate;
  }

  public getName(): string {
    return this.data.name;
  }

  public async setPrivate(isPrivate: boolean): Promise<boolean> {
    const pool = ModmailBot.getDB();
    return pool.categories.setPrivate(this.data.id, isPrivate);
  }

  public getEmoji(): string {
    return this.data.emojiID;
  }

  public getID(): string {
    return this.data.id;
  }

  public isActive(): boolean {
    return this.data.isActive;
  }

  public getGuildID(): string {
    return this.data.guildID;
  }

  public getDescription(): string {
    return this.data.description;
  }

  public toString(): string {
    return `${this.data.name} (${this.data.id})`;
  }

  public async getRoles(adminOnly = false): Promise<Role[]> {
    const pool = ModmailBot.getDB();
    const roles = await pool.permissions.fetchAll(this.data.id);

    if (adminOnly) {
      return roles.filter((r: Role) => r.level === RoleLevel.Admin);
    }
    return roles;
  }

  /**
   * Whether or not a certain user is prevented from contacting this category
   * @param {string} userID
   * @returns {Promise<boolean>}
   */
  public async isMuted(userID: string): Promise<boolean> {
    const pool = ModmailBot.getDB();
    const muted = await pool.mutes.fetch(userID, this.data.id);

    return muted !== null;
  }

  /**
   * Whether or not a category has met the maximum threads possible
   * @returns {Promise<boolean>}
   */
  public async isMaxed(): Promise<boolean> {
    const pool = ModmailBot.getDB();
    const threads = await pool.threads.countCategory(this.data.id);

    return threads >= MAX_THREADS;
  }

  public async getGuild(): Promise<Guild | null> {
    const guildID = this.getGuildID();

    try {
      return this.modmail.guilds.fetch(guildID, true);
    } catch (_) {
      return null;
    }
  }

  /**
   * Get the Discord category channel associated with this category
   * @returns {Promise<CategoryChannel | null>}
   */
  public async getCategory(): Promise<CategoryChannel | null> {
    if (this.data.channelID === null) {
      return null;
    }

    try {
      const channel = await this.modmail.channels.fetch(
        this.data.channelID,
        true,
      );

      return channel as CategoryChannel;
    } catch (_) {
      return null;
    }
  }

  /**
   * Activate this category with a given Discord category channel ID
   * @param {string} channelID An ID of a Discord category channel
   * @returns {Promise<boolean>}
   */
  public async reactivate(channelID: string): Promise<boolean> {
    const pool = ModmailBot.getDB();

    return pool.categories.reactivate(this.data.id, channelID);
  }

  /**
   * Deactivate this category
   * @returns {Promise<boolean>}
   */
  public async deactivate(): Promise<boolean> {
    const pool = ModmailBot.getDB();

    return pool.categories.deactivate(this.data.id);
  }

  /**
   * Set a new unique emoji for this category
   * @returns {Promise<boolean>}
   */
  public async setEmoji(emoji: string): Promise<boolean> {
    const pool = ModmailBot.getDB();

    return pool.categories.setEmote(this.data.id, emoji);
  }

  /**
   * Mute a user from this category
   * @param {string} userID The user to mute
   * @param {number} till The epoch in ms to be muted until
   * @param {string | undefined} reason The reason for the mute
   */
  public async mute(
    userID: string,
    till: number,
    reason?: string,
  ): Promise<boolean> {
    const pool = ModmailBot.getDB();
    const mute: MuteStatus = {
      till,
      category: this.getID(),
      reason: reason || 'No Reason Provided',
      user: userID,
    };

    return pool.mutes.add(mute);
  }

  /**
   * Unmute a user early from this category
   * @returns {Promise<boolean>}
   */
  public async unmute(userID: string): Promise<boolean> {
    const pool = ModmailBot.getDB();
    return pool.mutes.delete(userID, this.getID());
  }
}
