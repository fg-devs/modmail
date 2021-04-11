import { Mutex, MutexInterface } from 'async-mutex';
import {
  DMChannel,
  GuildMember,
  Message,
  PartialGuildMember,
  PartialMessage, Role,
} from 'discord.js';
import { Embeds } from '../util';
import { CONFIG } from '../globals';
import { Thread } from '../controllers';
import ModmailBot from './';

export default class EventHandler {
  private readonly modmail: ModmailBot;

  private readonly queue: Map<string, MutexInterface>;

  constructor(modmail: ModmailBot) {
    this.modmail = modmail;
    this.queue = new Map<string, MutexInterface>();
  }

  /**
   * onMessage is called when a new message appears that the bot can see
   * @param {Message} msg
   */
  public async onMessage(msg: Message): Promise<void> {
    const msgCtrl = this.modmail.messages;
    if (!msg.author.bot && !msg.content.startsWith(CONFIG.bot.prefix)) {
      if (msg.channel.type === 'dm') {
        const mutex = this.getMutex(msg.author.id);
        const release = await mutex.acquire();
        try {
          await msgCtrl.handleDM(msg);
        } finally {
          release();
        }
      } else {
        await msgCtrl.handle(msg);
      }
    }
  }

  /**
   * Called on ready
   */
  public async onReady(): Promise<void> {
    const log = EventHandler.getLogger();
    log.info('Bot is ready.');
    this.modmail.user?.setPresence({
      activity: {
        type: 'PLAYING',
        name: 'DM me for Help!',
      },
    });
  }

  /**
   * Called on message delete
   * @param {Message | PartialMessage} msg
   */
  public async onMessageDelete(msg: Message | PartialMessage): Promise<void> {
    const pool = ModmailBot.getDB();

    if (msg.partial) {
      return;
    }

    if (!msg.author.bot && !msg.content.startsWith(CONFIG.bot.prefix)) {
      const thread = await this.modmail.threads.getByAuthor(msg.author.id);
      if (thread === null) {
        return;
      }

      const thMsg = await thread.getMessage(msg.id);

      if (thMsg !== null) {
        await thMsg.delete();
      } else {
        await pool.messages.setDeleted(msg.id);
      }
    }
  }

  /**
   * Called on message edit
   * @param {Message | PartialMessage} oldMsg
   * @param {Message | PartialMessage} newMsgOpt
   */
  public async onMessageEdit(
    oldMsg: Message | PartialMessage,
    newMsgOpt: Message | PartialMessage,
  ): Promise<void> {
    const newMsg = newMsgOpt.partial
      ? await newMsgOpt.fetch()
      : newMsgOpt as Message;

    // Ignore URL previews
    if (oldMsg.content === newMsgOpt.content) {
      return;
    }

    if (newMsg.channel instanceof DMChannel && !newMsg.author.bot) {
      const msgCtrl = this.modmail.messages;
      const thMsg = await msgCtrl.getByID(oldMsg.id);

      if (thMsg !== null) {
        await thMsg.editClient(oldMsg, newMsg);
        await newMsg.react('✏');
      }
    }
  }

  /**
   * Called on member join
   * @param {GuildMember} member
   */
  public async onMemberJoin(member: GuildMember): Promise<void> {
    const thread = await this.modmail.threads.getByAuthor(member.id);

    if (thread === null) {
      return;
    }

    const threadChan = await thread.getThreadChannel();

    if (threadChan) {
      const embed = Embeds.memberJoined(member);
      await threadChan.send(embed);
    }
  }

  public async onMemberLeave(
    member: GuildMember | PartialGuildMember,
  ): Promise<void> {
    const thread = await this.modmail.threads.getByAuthor(member.id);

    if (thread === null) {
      return;
    }

    const threadChan = await thread.getThreadChannel();

    if (threadChan) {
      const target = member.partial
        ? await this.modmail.users.fetch(member.id, true)
        : member.user;
      const embed = Embeds.memberLeft(target);
      await threadChan.send(embed);
    }
  }

  public async onMemberUpdate(
    oldMem: GuildMember | PartialGuildMember,
    newMem: GuildMember,
  ): Promise<void> {
    const thread = await this.modmail.threads.getByAuthor(oldMem.id);

    if (thread === null) {
      return;
    }

    if (oldMem.roles.cache.size !== newMem.roles.cache.size) {
      await EventHandler.postRoles(thread, oldMem, newMem);
    }
  }

  private static async postRoles(
    thread: Thread,
    oldMem: GuildMember | PartialGuildMember,
    newMem: GuildMember,
  ): Promise<void> {
    const threadChan = await thread.getThreadChannel();

    if (threadChan === null) {
      return;
    }

    const oldRolesRef = oldMem.roles.cache;
    const newRolesRef = newMem.roles.cache;
    const roles = newMem.roles.cache.values();
    let added: Role | null = null;
    let removed: Role | null = null;
    let roleOpt = roles.next();

    while (!roleOpt.done) {
      const role = roleOpt.value;
      // check if the role was added
      if (!oldRolesRef.has(role.id)) {
        added = role;
        break;
      }

      roleOpt = roles.next();
    }

    if (added !== null) {
      const embed = Embeds.memberRoleAdd(newMem, added);
      await threadChan.send(embed);
      return;
    }

    const oldRoles = oldMem.roles.cache.values();
    roleOpt = oldRoles.next();

    while (!roleOpt.done) {
      const role = roleOpt.value;
      if (!newRolesRef.has(role.id)) {
        removed = role;
        break;
      }
      roleOpt = oldRoles.next();
    }

    if (removed !== null) {
      const embed = Embeds.memberRoleRemove(newMem, removed);
      await threadChan.send(embed);
    }
  }

  private getMutex(userID: string): MutexInterface {
    if (!this.queue.has(userID)) {
      const mutex = new Mutex();
      this.queue.set(userID, mutex);
      return mutex;
    }
    return this.queue.get(userID) as Mutex;
  }

  private static getLogger() {
    return ModmailBot.getLogger('events');
  }
}
