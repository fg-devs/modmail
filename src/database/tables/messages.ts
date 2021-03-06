import { Message } from '@newcircuit/modmail-types';
import { DBMessage } from '../types';
import { Pool } from 'pg';
import Table from '../table';

export default class MessagesTable extends Table {
  constructor(pool: Pool) {
    super(pool, 'messages');
  }

  /**
   * Log a message
   * @method add
   * @param {Message} message
   * @returns {Promise<void>}
   */
  public async add(message: Message): Promise<void> {
    const client = await this.getClient();

    try {
      await client.query(
        `INSERT INTO modmail.messages
         (sender, client_id, modmail_id, content, thread_id, internal)
         VALUES ($1, $2, $3, $4, $5, $6);`,
        [message.sender, message.clientID, message.modmailID,
          message.content, message.threadID, message.internal,],
      );
    } finally {
      client.release();
    }
  }

  /**
   * Get the last message of a thread
   * @param {string} id
   * @param {string} author
   * @returns {Promise<Message | null>}
   */
  public async getLastMessage(id: string, author: string): Promise<Message | null> {
    const client = await this.getClient();

    try {
      const res = await client.query(
        `SELECT *
         FROM modmail.messages
         WHERE sender = $1
           AND thread_id = $2
           AND is_deleted = false
           AND internal = false
         ORDER BY modmail_id DESC;`,
        [author, id],
      );

      if (res.rowCount === 0) {
        return null;
      }

      return MessagesTable.parse(res.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * Set a message to deleted
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  public async setDeleted(id: string): Promise<boolean> {
    const client = await this.getClient();

    try {
      const res = await client.query(
        `UPDATE modmail.messages
         SET is_deleted = true
         WHERE modmail_id = $1
            OR client_id = $1;`,
        [id],
      );

      return res.rowCount !== 0;
    } finally {
      client.release();
    }
  }

  /**
   * @method fetch
   * @param {string} id
   * @returns {Promise<Message | null>}
   */
  public async fetch(id: string): Promise<Message | null> {
    const client = await this.getClient();

    try {
      const res = await client.query(
        `SELECT *
         FROM modmail.messages
         WHERE modmail_id = $1
            OR client_id = $1;`,
        [id],
      );

      if (res.rowCount === 0) {
        return null;
      }

      return MessagesTable.parse(res.rows[0]);
    } finally {
      client.release();
    }
  }

  public async fetchAll(threadID: string): Promise<Message[]> {
    const client = await this.getClient();

    try {
      const res = await client.query(
        `SELECT *
         FROM modmail.messages
         WHERE thread_id = $1
         ORDER BY modmail_id`,
        [threadID],
      );

      return res.rows.map((data) => MessagesTable.parse(data));
    } finally {
      client.release();
    }
  }

  public async fetchLast(threadID: String): Promise<Message | null> {
    const client = await this.getClient();

    try {
      const res = await client.query(
        `SELECT *
         FROM modmail.messages
         WHERE thread_id = $1
         ORDER BY modmail_id DESC
         LIMIT 1;`,
        [threadID],
      );

      if (res.rowCount === 0) {
        return null;
      }

      return MessagesTable.parse(res.rows[0]);
    } finally {
      client.release();
    }
  }

  public async getPastMessages(threadID: string): Promise<Message[]> {
    const client = await this.getClient();

    try {
      const res = await client.query(
        `SELECT *
         FROM modmail.messages
         WHERE thread_id = $1
           AND is_deleted = false;`,
        [threadID],
      );
      return res.rows.map((row: DBMessage) => MessagesTable.parse(row));
    } finally {
      client.release();
    }
  }

  /**
   * Initialize the messages table
   */
  protected async init(): Promise<void> {
    const client = await this.getClient();

    try {
      await client.query(
        `CREATE TABLE IF NOT EXISTS modmail.messages
         (
             sender     BIGINT                NOT NULL
                 CONSTRAINT messages_users_id_fk
                     REFERENCES modmail.users,
             client_id  BIGINT,
             modmail_id BIGINT                NOT NULL,
             content    TEXT                  NOT NULL,
             thread_id  BIGINT                NOT NULL
                 CONSTRAINT messages_threads_id_fk
                     REFERENCES modmail.threads,
             is_deleted BOOLEAN DEFAULT false NOT NULL,
             internal   BOOLEAN DEFAULT false NOT NULL
         );`,
      );

      await client.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS messages_client_id_uindex on modmail.messages (client_id);`,
      );

      await client.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS messages_modmail_id_uindex on modmail.messages (modmail_id);`,
      );
    } finally {
      client.release();
    }
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
    const client = await this.getClient();

    try {
      await client.query(
        `UPDATE modmail.messages SET modmail_id = $1 WHERE modmail_id = $2;`,
        [newID, oldID],
      );
    } finally {
      client.release();
    }
  }
}
