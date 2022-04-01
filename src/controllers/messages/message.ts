import {
  Attachment,
  Edit,
  Message as PartialMessage,
} from '@newcircuit/modmail-types';
import {
  GuildMember,
  Message as DMessage,
  PartialMessage as PartialDMessage, User,
} from 'discord.js';
import { Thread } from '..';
import { Embeds } from '../../util';
import ModmailBot from '../../bot';

export default class Message {
  private readonly modmail: ModmailBot;

  private readonly data: PartialMessage;

  private thread: Thread | null;

  constructor(modmail: ModmailBot, data: PartialMessage) {
    this.modmail = modmail;
    this.data = data;
    this.thread = null;
  }

  public getID(): string {
    return this.data.modmailID;
  }

  public getClientID(): string | null {
    return this.data.clientID;
  }

  public isInternal(): boolean {
    return this.data.internal;
  }

  public getSenderID(): string {
    return this.data.sender;
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
    return this.data.content;
  }

  /**
   * Get the message copy in the member's DMs
   * @return {Promise<DMessage | null>}
   */
  public async getClientMessage(): Promise<DMessage | null> {
    const thread = await this.getThread();

    if (thread === null) { return null; }

    const dm = await thread.getDMChannel();

    try {
      return await dm.messages.fetch(
        this.data.clientID || '',
        true,
      );
    } catch (_) {
      return null;
    }
  }

  /**
   * Get the message copy of the thread
   * @return {Promise<DMessage | null>}
   */
  public async getModmailMessage(): Promise<DMessage | null> {
    const thread = await this.getThread();

    if (thread === null) { return null; }

    const channel = await thread.getThreadChannel();

    if (channel === null) { return null; }

    try {
      return await channel.messages.fetch(
        this.data.modmailID,
        true,
      );
    } catch (_) {
      return null;
    }
  }

  public async getAttachments(): Promise<Attachment[]> {
    const pool = ModmailBot.getDB();

    return pool.attachments.fetch(this.data.modmailID);
  }

  public async getEdits(): Promise<Edit[]> {
    const pool = ModmailBot.getDB();

    return pool.edits.fetch(this.data.modmailID);
  }

  public async getUser(): Promise<User> {
    return this.modmail.users.fetch(this.data.sender);
  }

  /**
   * When a member (client) edits their message this method is called
   * @param  {DMessage | PartialDMessage} _oldMsg Not utilized
   * @param  {DMessage} newMsg The message they edited
   * @return {Promise<void>}
   */
  public async editClient(
    _oldMsg: DMessage | PartialDMessage,
    newMsg: DMessage,
  ): Promise<void> {
    const thread = await this.getThread();
    const pool = ModmailBot.getDB();

    if (thread === null) {
      return;
    }

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
    embed.description = `**Original**\n${this.data.content}`;
    // edit the thread iteration of the message that was edited
    await thMessage.edit(embed);
  }

  /**
   * Edit the Discord copies of this message and store this new edit in the
   * database
   * @param  {string} content The new content that is replacing the current
   * message
   * @return {Promise<void>}
   */
  public async edit(content: string): Promise<void> {
    const pool = ModmailBot.getDB();
    const thMessage = await this.getModmailMessage();
    const clMessage = await this.getClientMessage();
    const author = await this.getUser();

    // update the message in the thread
    if (thMessage !== null) {
      // store the new edit to the edits table
      await pool.edits.add(content, thMessage.id);

      const threadEmbed = thMessage.embeds[0];
      const edits = await pool.edits.fetch(thMessage.id);
      const embed = Embeds.editsSend(author, edits);

      threadEmbed.description = content;
      embed.description = `**Original**\n${this.data.content}`;

      // edit the thread iteration of the message that was edited
      await thMessage.edit(embed);
    }

    // update the user's end
    if (clMessage !== null) {
      const clientEmbed = clMessage.embeds[0];
      clientEmbed.description = content;

      await clMessage.edit(clientEmbed);
    }
  }

  /**
   * Delete messages on Discord and mark this message in the database as
   * deleted
   * @return {Promise<void>}
   */
  public async delete(): Promise<void> {
    const pool = ModmailBot.getDB();
    const mmMsg = await this.getModmailMessage();
    const ccMsg = await this.getClientMessage();

    if (mmMsg !== null) {
      const embed = Embeds.markDeleted(mmMsg.embeds[0]);
      await mmMsg.edit(embed);
    }

    if (ccMsg !== null) {
      await ccMsg.delete();
    }

    await pool.messages.setDeleted(this.data.modmailID);
  }

  /**
   * Get the thread that this message is part of
   * @return {Promise<Thread | null>}
   */
  public async getThread(): Promise<Thread | null> {
    if (this.thread !== null) {
      return this.thread;
    }

    const thread = await this.modmail.threads.getByID(this.data.threadID);

    if (thread !== null) {
      this.thread = thread;
      return thread;
    }
    return null;
  }
}
