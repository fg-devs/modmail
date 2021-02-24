import { MuteStatus } from '@Floor-Gang/modmail-types';
import { DBMuteStatus } from '../models/types';
import { PoolClient } from 'pg';
import Table from '../models/table';

export default class MutesTable extends Table {
  constructor(pool: PoolClient) {
    super(pool, 'mutes');
  }

  /**
   * Mute a user for a category
   * @param {MuteStatus} mute
   * @returns {Promise<boolean>}
   */
  public async add(mute: MuteStatus): Promise<boolean> {
    const isMuted = await this.isMuted(mute.user, mute.category);

    if (isMuted) {
      return false;
    }

    await this.pool.query(
      `INSERT INTO modmail.mutes (user_id, category_id, till, reason)
       VALUES ($1, $2, $3, $4);`,
      [mute.user, mute.category, mute.till, mute.reason],
    );
    return true;
  }

  /**
   * Unmute a user
   * @param {string} user
   * @param {string} category
   * @returns {Promise<boolean>}
   */
  public async delete(user: string, category: string): Promise<boolean> {
    const res = await this.pool.query(
      `DELETE
       FROM modmail.mutes
       WHERE user_id = $1
         AND category_id = $2
         AND till > $3;`,
      [user, category, Date.now()],
    );

    return res.rowCount !== 0;
  }

  /**
   * Get all the mutes for a user
   * @param {string} user
   * @returns {Promise<MuteStatus>}
   */
  public async fetchAll(user: string): Promise<MuteStatus[]> {
    const res = await this.pool.query(
      `SELECT *
       FROM modmail.mutes
       WHERE user_id = $1`,
      [user],
    );

    return res.rows.map(MutesTable.parse);
  }

  /**
   * Get a muted user for a given category
   * @param {string} user
   * @param {string} category
   * @returns {Promise<MuteStatus | null>}
   */
  public async fetch(user: string, category: string): Promise<MuteStatus | null> {
    const res = await this.fetchAll(user);
    const now = Date.now();

    for (let i = 0; i < res.length; i += 1) {
      const mute = res[i];
      const { till } = mute;

      if (till > now && mute.category === category) {
        return mute;
      }
    }

    return null;
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
   * @param {string} user
   * @param {string} category
   * @returns {Promise<boolean>}
   */
  public async remove(user: string, category: string): Promise<boolean> {
    const res = await this.pool.query(
      `DELETE
       FROM modmail.mutes
       WHERE user_id = $1
         AND category_id = $2;`,
      [user, category],
    );

    return res.rowCount !== 0;
  }

  /**
   * Initialize the mutes table
   */
  protected async init(): Promise<void> {
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS modmail.mutes
       (
           user_id     BIGINT NOT NULL
               CONSTRAINT threads_users_id_fk
                   REFERENCES modmail.users,
           till        BIGINT NOT NULL,
           category_id BIGINT NOT NULL,
           reason      text   NOT NULL
       )`,
    );
  }

  /**
   * @param {DBMuteStatus} data
   * @returns {MuteStatus}
   */
  private static parse(data: DBMuteStatus): MuteStatus {
    return {
      user: data.user_id.toString(),
      category: data.category_id.toString(),
      till: data.till,
      reason: data.reason,
    };
  }
}
