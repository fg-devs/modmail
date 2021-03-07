import {
  Category as PartialCategory,
  MuteStatus,
  Role,
  RoleLevel,
} from '@NewCircuit/modmail-types';
import { CategoryChannel, Guild } from 'discord.js';
import ModmailBot from '../../bot';
import { MAX_THREADS } from '../../../common/globals';

export default class Category {
  private readonly ref: PartialCategory;

  private readonly modmail: ModmailBot;

  constructor(modmail: ModmailBot, data: PartialCategory) {
    this.modmail = modmail;
    this.ref = data;
  }

  public isPrivate(): boolean {
    return this.ref.isPrivate;
  }

  public getName(): string {
    return this.ref.name;
  }

  public async setPrivate(isPrivate: boolean): Promise<boolean> {
    const pool = ModmailBot.getDB();
    return pool.categories.setPrivate(this.ref.id, isPrivate);
  }

  public getEmoji(): string {
    return this.ref.emojiID;
  }

  public getID(): string {
    return this.ref.id;
  }

  public isActive(): boolean {
    return this.ref.isActive;
  }

  public getGuildID(): string {
    return this.ref.guildID;
  }

  public getDescription(): string {
    return this.ref.description;
  }

  public toString(): string {
    return `${this.ref.name} (${this.ref.id})`;
  }

  public async getRoles(adminOnly = false): Promise<Role[]> {
    const pool = ModmailBot.getDB();
    const roles = await pool.permissions.fetchAll(this.ref.id);

    if (adminOnly) {
      return roles.filter((r: Role) => r.level === RoleLevel.Admin);
    }
    return roles;
  }

  public async isMuted(userID: string): Promise<boolean> {
    const pool = ModmailBot.getDB();
    const muted = await pool.mutes.fetch(userID, this.ref.id);

    return muted !== null;
  }

  public async isMaxed(): Promise<boolean> {
    const pool = ModmailBot.getDB();
    const threads = await pool.threads.countCategory(this.ref.id);

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

  public async getCategory(): Promise<CategoryChannel | null> {
    if (this.ref.channelID === null) {
      return null;
    }

    try {
      const channel = await this.modmail.channels.fetch(
        this.ref.channelID,
        true,
      );

      return channel as CategoryChannel;
    } catch (_) {
      return null;
    }
  }

  public async reactivate(channelID: string): Promise<boolean> {
    const pool = ModmailBot.getDB();

    return pool.categories.reactivate(this.ref.id, channelID);
  }

  public async deactivate(): Promise<boolean> {
    const pool = ModmailBot.getDB();

    return pool.categories.deactivate(this.ref.id);
  }

  public async setEmoji(emoji: string): Promise<boolean> {
    const pool = ModmailBot.getDB();

    return pool.categories.setEmote(this.ref.id, emoji);
  }

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

  public async unmute(userID: string): Promise<boolean> {
    const pool = ModmailBot.getDB();
    return pool.mutes.delete(userID, this.getID());
  }
}
