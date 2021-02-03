import {
  Message as PartialMessage,
} from 'modmail-types';
import {
  Message as DMessage,
  PartialMessage as PartialDMessage,
} from 'discord.js';
import Modmail from '../../Modmail';
import Thread from '../threads/thread';

export default class Message {
  private readonly modmail: Modmail;

  private readonly ref: PartialMessage;

  private thread: Thread | null;

  constructor(modmail: Modmail, data: PartialMessage) {
    this.modmail = modmail;
    this.ref = data;
    this.thread = null;
  }

  public async getClientMessage(): Promise<DMessage | null> {
    const thread = await this.getThread();

    if (thread === null) { return null; }

    const dm = await thread.getDMChannel();

    try {
      const msg = dm.messages.fetch(this.ref.clientID || '', true);
      return msg;
    } catch (_) {
      return null;
    }
  }

  public async getModmailMessage(): Promise<DMessage | null> {
    const thread = await this.getThread();

    if (thread === null) { return null; }

    const chan = await thread.getThreadChannel();

    if (chan === null) { return null; }

    try {
      const msg = chan.messages.fetch(this.ref.modmailID, true);
      return msg;
    } catch (_) {
      return null;
    }
  }

  public async editClient(
    oldMsg: DMessage | PartialDMessage,
    newMsg: DMessage,
  ): Promise<void> {
    const thread = await this.getThread();
    const pool = Modmail.getDB();

    if (thread === null) { return; }

    // get thread channel
    const thChan = await thread.getThreadChannel();
    // get thread message
    const dbMessage = await pool.messages.fetch(newMsg.id);

    if (thChan === null || dbMessage === null) {
      return;
    }

    const thMessage = await thChan.messages.fetch(dbMessage.modmailID);

    if (thMessage === undefined) { return; }

    const embed = thMessage.embeds[0];
    embed.description = newMsg.content;
    embed.addField(
      `Version ${embed.fields.length + 1}: `,
      oldMsg.content,
      false,
    );
    // edit the thread iteration of the message that was editted
    await thMessage.edit(embed);
    // store the new edit to the edits table
    await pool.edits.add({
      content: newMsg.content,
      message: thMessage.id,
      version: 0,
    });
  }

  public async edit(newContent: string): Promise<void> {
    const pool = Modmail.getDB();
    const threadMessage = await this.getModmailMessage();
    const clientMessage = await this.getClientMessage();

    if (threadMessage !== null) {
      const threadEmbed = threadMessage.embeds[0];
      threadEmbed.description = newContent;

      await threadMessage.edit(threadEmbed);
      await pool.edits.add({
        content: newContent,
        message: threadMessage.id,
        version: 0,
      });
    }

    if (clientMessage !== null) {
      const clientEmbed = clientMessage.embeds[0];
      clientEmbed.description = newContent;

      await clientMessage.edit(clientEmbed);
    }
  }

  public async delete(): Promise<void> {
    const pool = Modmail.getDB();
    const mmMsg = await this.getModmailMessage();
    const ccMsg = await this.getClientMessage();

    if (mmMsg !== null) {
      await mmMsg.delete();
    }

    if (ccMsg !== null) {
      await ccMsg.delete();
    }

    await pool.messages.setDeleted(this.ref.modmailID);
  }

  public async getThread(): Promise<Thread | null> {
    if (this.thread !== null) {
      return this.thread;
    }

    const thread = await this.modmail.threads.getByID(this.ref.threadID);

    if (thread !== null) {
      this.thread = thread;
      return thread;
    }
    return null;
  }
}
