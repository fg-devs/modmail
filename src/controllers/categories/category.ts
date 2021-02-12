import {
  Category as PartialCategory, MuteStatus,
} from '@Floor-Gang/modmail-types';
import Modmail from '../../Modmail';

export default class Category {
  private readonly ref: PartialCategory;

  private readonly modmail: Modmail;

  constructor(modmail: Modmail, data: PartialCategory) {
    this.modmail = modmail;
    this.ref = data;
  }

  public getName(): string {
    return this.ref.name;
  }

  public getEmoji(): string {
    return this.ref.emojiID;
  }

  public getID(): string {
    return this.ref.id;
  }

  public getGuildID(): string {
    return this.ref.guildID;
  }

  public async setActive(isActive: boolean): Promise<boolean> {
    const pool = Modmail.getDB();

    return pool.categories.setActive(this.ref.id, isActive);
  }

  public async setEmoji(emoji: string): Promise<boolean> {
    const pool = Modmail.getDB();

    return pool.categories.setEmote(this.ref.id, emoji);
  }

  public async mute(
    userID: string,
    till: number,
    reason?: string,
  ): Promise<boolean> {
    const pool = Modmail.getDB();
    const mute: MuteStatus = {
      till,
      category: this.getID(),
      reason: reason || 'No Reason Provided',
      user: userID,
    };

    return pool.mutes.add(mute);
  }

  public async unmute(userID: string): Promise<boolean> {
    const pool = Modmail.getDB();
    return pool.mutes.delete(userID, this.getID());
  }
}
