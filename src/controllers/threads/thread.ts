import {
  DMChannel,
  GuildMember,
  Message,
  TextChannel,
  User,
} from 'discord.js';
import { CommandoMessage } from 'discord.js-commando';
import {
  Thread as PartialThread,
  Message as PartialMessage,
} from '@Floor-Gang/modmail-types';
import Category from '../categories/category';
import Modmail from '../../Modmail';
import Embeds from '../../util/Embeds';
import MMMessage from '../messages/message';
import { CLOSE_THREAD_DELAY } from '../../globals';

export default class Thread {
  private modmail: Modmail

  private ref: PartialThread;

  constructor(
    modmail: Modmail,
    ref: PartialThread,
  ) {
    this.modmail = modmail;
    this.ref = ref;
  }

  public async close(): Promise<void> {
    const pool = Modmail.getDB();
    const dmEmbed = Embeds.closeThreadClient();
    const threadEmbed = Embeds.closeThread();
    const dmChannel = await this.getDMChannel();
    const thChannel = await this.getThreadChannel();

    try {
      await dmChannel.send(dmEmbed);
    } finally {
      await pool.threads.close(this.ref.channel);
      if (thChannel !== null) {
        await thChannel.send(threadEmbed);
        await new Promise((r) => setTimeout(r, CLOSE_THREAD_DELAY));
        await thChannel.delete('Thread closed');
      }
    }
  }

  public getID(): string {
    return this.ref.id;
  }

  public async getAuthor(): Promise<User> {
    return this.modmail.users.fetch(
      this.ref.author.id,
      true,
    );
  }

  public async getMember(): Promise<GuildMember | null> {
    const category = await this.getCategory();

    if (category === null) { return null; }

    try {
      const guild = await this.modmail.guilds.fetch(
        category.getGuildID(),
        true,
      );

      return guild.member(this.ref.author.id);
    } catch (_) {
      return null;
    }
  }

  public async getCategory(): Promise<Category | null> {
    return this.modmail.categories.getByID(this.ref.category);
  }

  public async getThreadChannel(): Promise<TextChannel | null> {
    try {
      const channel = await this.modmail.channels.fetch(
        this.ref.channel,
        true,
      );

      return channel.type === 'text'
        ? channel as TextChannel
        : null;
    } catch (_) {
      return null;
    }
  }

  public async getDMChannel(): Promise<DMChannel> {
    const user = await this.getAuthor();

    return user.dmChannel || user.createDM();
  }

  public async deleteLastMsg(authorID: string): Promise<void> {
    const msg = await this.getLastMessage(authorID);

    if (msg !== null) {
      await msg.delete();
    }
  }

  public async deleteMsg(id: string): Promise<void> {
    const msg = await this.getMessage(id);

    if (msg !== null) {
      await msg.delete();
    }
  }

  public async getMessage(id: string): Promise<MMMessage | null> {
    return this.modmail.messages.getByID(id);
  }

  public async getLastMessage(authorID: string): Promise<MMMessage | null> {
    return this.modmail.messages.getLastFrom(this.ref.id, authorID);
  }

  /**
   * Send a user's message to an active thread
   * @param {Message} msg The user's message
   */
  public async sendToThread(msg: Message): Promise<void> {
    const pool = Modmail.getDB();
    const attCtrl = this.modmail.attachments;

    const thMsgEmbed = Embeds.messageReceived(
      msg.content,
      msg.author,
    );
    const thChannel = await this.getThreadChannel();

    if (thChannel === null) {
      throw new Error(
        `Failed to retrieve the thread channel for ${this.ref.id}`
        + ', did it get deleted?',
      );
    }

    const thMessage = await thChannel.send(thMsgEmbed);

    // Modmail message
    const modmailMsg: PartialMessage = {
      clientID: msg.id,
      content: msg.content,
      edits: [],
      files: [],
      isDeleted: false,
      internal: false,
      modmailID: thMessage.id,
      sender: msg.author.id,
      threadID: this.ref.id,
    };

    await pool.messages.add(modmailMsg);
    await attCtrl.handle(msg, thChannel, thMessage.id);
    await msg.react('✅');
  }

  public async sendSR(
    msg: CommandoMessage,
    context: string,
    anonymously = false,
  ): Promise<void> {
    await this.send(context, msg.member as GuildMember, anonymously);

    await msg.delete();
  }

  public async sendMsg(msg: CommandoMessage, anonymously = false): Promise<void> {
    const content = msg.argString || '';

    await this.send(content, msg.member as GuildMember, anonymously);

    await msg.delete();
  }

  private async send(content: string, sender: GuildMember, anonymously = false) {
    const dmChannel = await this.getDMChannel();
    const thChannel = await this.getThreadChannel();
    const pool = Modmail.getDB();
    const footer = {
      text: anonymously
        ? 'Staff'
        : sender.roles.highest.name || 'Staff',
    };

    if (thChannel === null) {
      throw new Error("The thread channel doesn't exist anymore.");
    }

    const threadEmbed = anonymously
      ? Embeds.messageSendAnon(content, sender.user)
      : Embeds.messageSend(content, sender.user);

    const dmEmbed = anonymously
      ? Embeds.messageReceivedAnon(content)
      : Embeds.messageReceived(content, sender.user);

    threadEmbed.footer = footer;
    dmEmbed.footer = footer;

    const threadMessage = await thChannel.send(threadEmbed);
    const dmMessage = await dmChannel.send(dmEmbed);

    await pool.users.create(sender.id);
    await pool.messages.add({
      clientID: dmMessage.id,
      content,
      edits: [],
      files: [],
      isDeleted: false,
      internal: false,
      modmailID: threadMessage.id,
      sender: sender.id,
      threadID: this.ref.id,
    });
  }

  public async getUser(): Promise<User> {
    return this.modmail.users.fetch(this.ref.author.id);
  }
}
