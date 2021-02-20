import {
  Attachment,
  Edit,
  Message as PartialMessage,
} from '@Floor-Gang/modmail-types';
import {
  GuildMember,
  Message as DMessage,
  PartialMessage as PartialDMessage, User,
} from 'discord.js';
import Modmail from '../../Modmail';
import Thread from '../threads/thread';
import Embeds from '../../util/Embeds';
import { COLORS } from '../../globals';

export default class Message {
  private readonly modmail: Modmail;

  private readonly ref: PartialMessage;

  private thread: Thread | null;

  constructor(modmail: Modmail, data: PartialMessage) {
    this.modmail = modmail;
    this.ref = data;
    this.thread = null;
  }

  public getID(): string {
    return this.ref.modmailID;
  }

  public getClientID(): string | null {
    return this.ref.clientID;
  }

  public isInternal(): boolean {
    return this.ref.internal;
  }

  public getSenderID(): string {
    return this.ref.sender;
  }

  public async getSender(): Promise<GuildMember | User> {
    const thread = await this.getThread();
    if (thread === null) {
      return this.getUser();
    }

    const member = await thread.getMember(this.getSenderID());
    if (member !== null) {
      return member;
    }
    return this.getUser();
  }

  public getContent(): string {
    return this.ref.content;
  }

  public async getClientMessage(): Promise<DMessage | null> {
    const thread = await this.getThread();

    if (thread === null) { return null; }

    const dm = await thread.getDMChannel();

    try {
      return await dm.messages.fetch(
        this.ref.clientID || '',
        true,
      );
    } catch (_) {
      return null;
    }
  }

  public async getModmailMessage(): Promise<DMessage | null> {
    const thread = await this.getThread();

    if (thread === null) { return null; }

    const channel = await thread.getThreadChannel();

    if (channel === null) { return null; }

    try {
      return await channel.messages.fetch(
        this.ref.modmailID,
        true,
      );
    } catch (_) {
      return null;
    }
  }

  public async getAttachments(): Promise<Attachment[]> {
    const pool = Modmail.getDB();

    return pool.attachments.fetch(this.ref.modmailID);
  }

  public async getEdits(): Promise<Edit[]> {
    const pool = Modmail.getDB();

    return pool.edits.fetch(this.ref.modmailID);
  }

  public async getUser(): Promise<User> {
    return this.modmail.users.fetch(this.ref.sender);
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

    // store the new edit to the edits table
    await pool.edits.add(newMsg.content, thMessage.id);
    const edits = await pool.edits.fetch(thMessage.id);
    const embed = Embeds.editsRecv(newMsg.author, edits);
    embed.description = `**Original**\n${this.ref.content}`;
    // edit the thread iteration of the message that was edited
    await thMessage.edit(embed);
  }

  public async edit(newContent: string): Promise<void> {
    const pool = Modmail.getDB();
    const thMessage = await this.getModmailMessage();
    const author = await this.getUser();
    const clientMessage = await this.getClientMessage();

    if (thMessage !== null) {
      const threadEmbed = thMessage.embeds[0];
      threadEmbed.description = newContent;

      // store the new edit to the edits table
      await pool.edits.add(newContent, thMessage.id);
      const edits = await pool.edits.fetch(thMessage.id);
      const embed = Embeds.editsSend(author, edits);
      embed.description = `**Original**\n${this.ref.content}`;
      // edit the thread iteration of the message that was edited
      await thMessage.edit(embed);
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
      const embed = Embeds.markDeleted(mmMsg.embeds[0]);
      await mmMsg.edit(embed);
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
