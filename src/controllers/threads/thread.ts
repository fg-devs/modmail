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
} from 'modmail-types';
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

    await dmChannel.send(dmEmbed);

    if (thChannel !== null) {
      await thChannel.send(threadEmbed);
      await new Promise((r) => setTimeout(r, CLOSE_THREAD_DELAY));
      await thChannel.delete('Thread closed');
    }
    await pool.threads.close(this.ref.channel);
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
   * @param {Thread} thread The active thread
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
    const mmmsg: PartialMessage = {
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

    await pool.messages.add(mmmsg);
    await attCtrl.handle(msg, thChannel, thMessage.id);
    await msg.react('✅');
  }

  public async sendSR(
    msg: CommandoMessage,
    context: string,
    anonymously = false,
  ): Promise<void> {
    const pool = Modmail.getDB();
    const dmChannel = await this.getDMChannel();
    const member = await this.getMember();

    if (member === null) { return; }

    const footer = {
      text: member.roles.highest.name,
    };

    const threadEmbed = anonymously
      ? Embeds.messageSendAnon(context, member.user)
      : Embeds.messageSend(context, msg.author);

    const dmEmbed = anonymously
      ? Embeds.messageReceivedAnon(context)
      : Embeds.messageReceived(context, msg.author);

    threadEmbed.footer = footer;
    dmEmbed.footer = footer;

    const threadMessage = await msg.channel.send(threadEmbed);
    const dmMessage = await dmChannel.send(dmEmbed);

    await pool.users.create(msg.author.id);
    await pool.messages.add({
      clientID: dmMessage.id,
      content: context,
      edits: [],
      files: [],
      isDeleted: false,
      internal: false,
      modmailID: threadMessage.id,
      sender: msg.author.id,
      threadID: this.ref.id,
    });
  }

  public async sendToUser(msg: CommandoMessage, anonymously = false): Promise<void> {
    const pool = Modmail.getDB();
    const content = msg.argString || '';
    const dmChannel = await this.getDMChannel();
    const user = await this.getUser();

    if (user === null) {
      throw new Error(
        `Couldn't retrieve member for ${this.ref.author.id}, did they leave?`,
      );
    }

    const footer = {
      text: msg.member?.roles.highest.name,
    };
    const threadEmbed = anonymously
      ? Embeds.messageSendAnon(content, msg.author)
      : Embeds.messageSend(content, msg.author);
    const dmEmbed = anonymously
      ? Embeds.messageReceivedAnon(content)
      : Embeds.messageReceived(content, msg.author);

    threadEmbed.footer = footer;
    dmEmbed.footer = footer;

    const threadMessage = await msg.channel.send(threadEmbed);
    const dmMessage = await dmChannel.send(dmEmbed);

    await pool.users.create(msg.author.id);
    await pool.messages.add({
      clientID: dmMessage.id,
      content,
      edits: [],
      files: [],
      isDeleted: false,
      internal: false,
      modmailID: threadMessage.id,
      sender: msg.author.id,
      threadID: this.ref.id,
    });

    await msg.delete();
  }

  private async getUser(): Promise<User> {
    return this.modmail.users.fetch(this.ref.author.id);
  }
}
