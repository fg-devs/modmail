import { DBMessage, Message } from 'modmail-types';
import { PoolClient } from 'pg';
import Table from '../../models/table';
import Modmail from '../../Modmail';

export default class MessageManager extends Table {
  constructor(modmail: Modmail, pool: PoolClient) {
    super(modmail, pool, 'messages');
  }

  /**
   * Log a message
   * @method add
   * @param {Message} message
   * @returns {Promise<void>}
   */
  public async add(message: Message): Promise<void> {
    // TODO(dylan): Please make a constant for the schema and table name.
    await this.pool.query(
      `INSERT INTO ${this.name}`
      + ' (sender, client_id, modmail_id, content, thread_id, internal)'
      + ' VALUES ($1, $2, $3, $4, $5, $6)',
      [
        message.sender,
        message.clientID,
        message.modmailID,
        message.content,
        message.threadID,
        message.internal,
      ],
    );
  }

  /**
   * Get the last message of a thread
   * @param {string} threadID
   * @param {string} author
   * @returns {Promise<Message>}
   * @throws {Error} If nothing was resolved
   */
  public async getLastMessage(id: string, author: string): Promise<Message> {
    const res = await this.pool.query(
      `SELECT * FROM ${this.name}`
      + ' WHERE sender = $1'
      + ' AND thread_id = $2'
      + ' AND is_deleted = false'
      + ' AND internal = false'
      + ' ORDER BY modmail_id DESC',
      [author, id],
    );

    if (res.rowCount === 0) {
      throw new Error(`${id} didn't resolve anything.`);
    }

    const row = res.rows[0];
    return {
      clientID: row.client_id,
      content: row.content,
      edits: [],
      files: [],
      isDeleted: row.is_deleted,
      modmailID: row.modmail_id,
      sender: row.sender,
      internal: row.internal,
      threadID: row.thread_id,
    };
  }

  /**
   * Set a message to deleted
   * @param {string} id
   * @returns {Promise<void>}
   * @throws {Error} If nothing is updated
   */
  public async setDeleted(id: string): Promise<void> {
    const res = await this.pool.query(
      `UPDATE ${this.name} SET`
      + ' is_deleted = true'
      + ' WHERE modmail_id = $1'
      + ' OR client_id = $1',
      [id],
    );

    if (res.rowCount === 0) {
      throw new Error('Nothing was updated');
    }
  }

  /**
   * @method fetch
   * @param {string} id
   * @returns {Promise<Message | null>}
   */
  public async fetch(id: string): Promise<Message | null> {
    const res = await this.pool.query(
      `SELECT * FROM ${this.name} WHERE modmail_id = $1 OR client_id = $1`,
      [id],
    );

    if (res.rowCount === 0) {
      return null;
    }

    return MessageManager.parse(res.rows[0]);
  }

  public async getPastMessages(threadID: string): Promise<Message[]> {
    const res = await this.pool.query(
      `SELECT * FROM ${this.name} WHERE thread_id = $1 AND is_deleted = false`,
      [threadID],
    );
    return res.rows.map((row: DBMessage) => MessageManager.parse(row));
  }

  /**
   * Initialize the messages table
   */
  protected async init(): Promise<void> {
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS ${this.name} (`
      + ' sender bigint not null'
      + '   constraint messages_users_id_fk'
      + '   references modmail.users,'
      + ' client_id bigint,'
      + ' modmail_id bigint not null,'
      + ' content text not null,'
      + ' thread_id bigint not null'
      + '   constraint messages_threads_id_fk'
      + '   references modmail.threads,'
      + ' is_deleted boolean default false not null,'
      + ' internal boolean default false not null)',
    );

    await this.pool.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS messages_client_id_uindex on ${this.name} (client_id);`,
    );

    await this.pool.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS messages_modmail_id_uindex on ${this.name} (modmail_id);`,
    );
  }

  /**
   * @method parse
   * @param {DBMessage} data
   * @returns {Message}
   */
  private static parse(data: DBMessage): Message {
    return {
      clientID: data.client_id !== null
        ? data.client_id.toString()
        : data.client_id,
      content: data.content,
      edits: [],
      files: [],
      isDeleted: data.is_deleted,
      modmailID: data.modmail_id.toString(),
      sender: data.sender.toString(),
      internal: data.internal,
      threadID: data.thread_id.toString(),
    };
  }

  public async update(oldID: string, newID: string): Promise<void> {
    await this.pool.query(
      `UPDATE ${this.name} SET modmail_id = $1 WHERE modmail_id = $2`,
      [newID, oldID],
    );
  }
}
