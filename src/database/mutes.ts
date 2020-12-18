import { CONFIG } from '../globals';
import { CategoryID, DiscordID } from '../models/identifiers';
import { IMuteManager } from '../models/interfaces';
import { DBMuteStatus, MuteStatus } from '../models/types';
import Time from '../util/Time';
import Table from './table';

const TABLE = `${CONFIG.database.schema}.mutes`;

export default class MuteManager extends Table implements IMuteManager {
  /**
   * Mute a user for a category
   * @param {DiscordID} userID
   * @param {CategoryID} categoryID
   * @returns {Promise<void>}
   * @throws {Error} if the user wasn't added to the database
   */
  public async add(mute: MuteStatus): Promise<void> {
    const muted = this.fetch(mute.user, mute.category);

    if (muted) {
      throw new Error(`${mute.user} is already muted.`);
    }

    await this.pool.query(
      `INSERT INTO ${TABLE} (user_id, category_id, till, reason)`
      + ' VALUES ($1, $2, $3, $4);',
      [mute.user, mute.category, mute.till, mute.reason],
    );
  }

  /**
   * Unmute a user
   * @param {DiscordID} user
   * @param {CategoryID} category
   * @returns {Promise<void>}
   * @throws {Error} if nothing happened
   */
  public async delete(user: DiscordID, cat: CategoryID): Promise<void> {
    const res = await this.pool.query(
      `DELETE FROM ${TABLE}`
      + ' WHERE user_id=$1 AND category_id=$2 AND till > $3',
      [user, cat, Time.now()],
    );

    if (res.rowCount === 0) {
      throw new Error(`${user} wasn't muted`);
    }
  }

  /**
   * Get all the mutes for a user
   * @param {DiscordID} user
   * @returns {Promise<MuteStatus>}
   */
  public async fetchAll(user: DiscordID): Promise<MuteStatus[]> {
    const res = await this.pool.query(
      `SELECT * FROM ${TABLE} WHERE user_id=$1`,
      [user],
    );

    return res.rows.map(MuteManager.parse);
  }

  /**
   * Get a muted user for a given category
   * @param {DiscordID} user
   * @param {CategoryID} category
   * @returns {Promise<MuteStatus | null>}
   */
  public async fetch(user: DiscordID, category: CategoryID): Promise<MuteStatus | null> {
    const res = await this.fetchAll(user);
    const now = Time.now();

    for (let i = 0; i < res.length; i += 1) {
      const mute = res[i];

      if (mute.till < now && mute.category === category) {
        return mute;
      }
    }

    return null;
  }

  /**
   * Check if a given user is a muted for a category
   * @param {DiscordID} user
   * @param {CategoryID} category
   * @returns {Promise<boolean>}
   */
  public async isMuted(user: DiscordID, category: CategoryID): Promise<boolean> {
    try {
      await this.fetch(user, category);
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Unmute a user from a category
   * @param {DiscordID} user
   * @param {CategoryID} category
   * @returns {Promise<void>}
   * @throws {Error} If they weren't unmuted
   */
  public async remove(user: DiscordID, category: CategoryID): Promise<void> {
    const res = await this.pool.query(
      `DELETE FROM ${TABLE} WHERE user_id=$1 AND category_id=$2`,
      [user, category],
    );

    if (res.rowCount === 0) {
      throw new Error('Failed to remove user from mutes table.');
    }
  }

  /**
   * @param {DBMuteStatus} data
   * @returns {MuteStatus}
   */
  private static parse(data: DBMuteStatus): MuteStatus {
    return {
      user: data.user_id,
      category: data.category_id,
      till: data.till,
      reason: data.reason,
    };
  }
}
