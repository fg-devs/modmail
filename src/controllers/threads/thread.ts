import {
  DMChannel, GuildMember, Message, MessageAttachment, TextChannel, User,
} from 'discord.js';
import { CommandoMessage } from 'discord.js-commando';
import {
  Attachment,
  Edit,
  Message as PartialMessage,
  Thread as PartialThread,
} from '@Floor-Gang/modmail-types';
import Category from '../categories/category';
import Modmail from '../../Modmail';
import Embeds from '../../util/Embeds';
import MMMessage from '../messages/message';
import { CLOSE_THREAD_DELAY } from '../../globals';
import ThreadController from './threads';

export default class Thread {
  private modmail: Modmail;

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
  public async recvMsg(msg: Message): Promise<void> {
    const pool = Modmail.getDB();
    const attCtrl = this.modmail.attachments;

    const thMsgEmbed = Embeds.messageRecv(
      msg.content,
      msg.author,
      false,
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
    await attCtrl.handleDM(msg);
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

  public async recvAttachment(msg: Message, attachment: Attachment): Promise<void> {
    const thEmbed = Embeds.attachmentRecv(attachment, msg.author, false);
    const thChannel = await this.getThreadChannel();

    if (thChannel === null) {
      return;
    }

    await thChannel.send(thEmbed);
  }

  public async sendMsg(msg: CommandoMessage, anonymously = false): Promise<void> {
    const content = msg.argString || '';
    const attachments = msg.attachments.values();
    const attTasks: Promise<void>[] = [];

    await this.send(content, msg.member as GuildMember, anonymously);

    let attOpt = attachments.next();
    let task;
    while (!attOpt.done) {
      task = this.sendAttachment(msg, attOpt.value, anonymously);
      attTasks.push(task);
      attOpt = attachments.next();
    }

    await Promise.all(attTasks);
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
      throw new Error('The thread channel doesn\'t exist anymore.');
    }

    const threadEmbed = Embeds.messageSend(content, sender, anonymously);

    const dmEmbed = Embeds.messageRecv(content, sender, anonymously);

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

  private async sendAttachment(
    msg: CommandoMessage,
    msgAtt: MessageAttachment,
    anonymously = false,
  ): Promise<void> {
    const dmChannel = await this.getDMChannel();
    const thChannel = await this.getThreadChannel();
    const modmail = Modmail.getModmail();
    const attachment = await modmail.attachments.create(msg as Message, msgAtt);

    if (thChannel === null) {
      throw new Error('The thread channel doesn\'t exist anymore.');
    }

    const threadEmbed = Embeds.attachmentSend(
      attachment,
      msg.member || msg.author,
      anonymously,
    );
    const dmEmbed = Embeds.attachmentRecv(
      attachment,
      msg.member || msg.author,
      anonymously,
    );

    await thChannel.send(threadEmbed);
    await dmChannel.send(dmEmbed);
  }

  public async forward(forwarder: User, category: Category): Promise<boolean> {
    const modmail = Modmail.getModmail();
    const pool = Modmail.getDB();
    const author = await this.getUser();
    const channel = await ThreadController.setupChannel(
      author,
      category,
      this.ref.isAdminOnly,
      forwarder,
    );

    if (channel === null) {
      return false;
    }

    await pool.threads.forward(this.ref.id, category.getID(), channel.id);

    const messages = await modmail.messages.getAll(this.ref.id);
    const users = new Map<string, User>();
    const attachments = new Map<string, Attachment[]>();
    const edits = new Map<string, Edit[]>();
    const usrTasks: Promise<User>[] = [];
    const msgTasks: Promise<Message>[] = [];
    const attTasks: Promise<Attachment[]>[] = [];
    const edtTasks: Promise<Edit[]>[] = [];

    // fetch all users for each message
    for (let i = 0; i < messages.length; i += 1) {
      const msg = messages[i];
      usrTasks.push(msg.getUser());
      edtTasks.push(msg.getEdits());
      attTasks.push(msg.getAttachments());
    }

    (await Promise.all(usrTasks)).forEach((user) => users.set(user.id, user));
    (await Promise.all(edtTasks)).forEach((msgEdits) => {
      if (msgEdits.length > 0) {
        edits.set(msgEdits[0].message, msgEdits);
      }
    });
    (await Promise.all(attTasks)).forEach((msgAtt) => {
      if (msgAtt.length > 0) {
        attachments.set(msgAtt[0].messageID, msgAtt);
      }
    });

    for (let i = 0; i < messages.length; i += 1) {
      const msg = messages[i];
      const user = users.get(msg.getSender());
      if (user === undefined) {
        continue;
      }
      const msgAtts = attachments.get(msg.getID());
      const msgEdits = edits.get(msg.getID());
      let embed;
      let task;

      if (msgEdits) {
        embed = Embeds.edits(user, msgEdits);
        task = channel.send(embed);
        msgTasks.push(task);
      } else if (msgAtts) {
        msgAtts.forEach((att) => {
          embed = Embeds.attachmentSend(att, user, false);
          task = channel.send(embed);
          msgTasks.push(task);
        });
      } else {
        embed = Embeds.messageSend(msg.getContent(), user);
        task = channel.send(embed);
        msgTasks.push(task);
      }
    }

    await Promise.all(msgTasks);
    return true;
  }

  public async getUser(): Promise<User> {
    return this.modmail.users.fetch(this.ref.author.id);
  }
}
