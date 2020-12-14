import { IMessageManager } from '../models/interfaces';
import { Message } from '../models/types';
import Table from './table';

export default class MessageManager extends Table implements IMessageManager {
  public async add(message: Message): Promise<void> {
    await this.pool.query(
      'INSERT INTO modmail.messages (sender, client_id, modmail_id, content, thread_id) VALUES ($1, $2, $3, $4, $5)',
      [message.sender, message.clientID, message.modmailID, message.content, message.threadID],
    );
  }

  public async deleted(id: string): Promise<void> {
    await this.pool.query('UPDATE modmail.messages SET is_deleted = true WHERE modmail_id = $1 OR client_id = $1',
      [id]);
  }
}
