import { Mutex, MutexInterface } from 'async-mutex';
import {
  DMChannel, GuildMember, Message, PartialGuildMember, PartialMessage,
} from 'discord.js';
import Modmail from '../Modmail';
import Embeds from '../util/Embeds';
import { CONFIG } from '../globals';

export default class EventHandler {
  private readonly modmail: Modmail;

  private readonly queue: Map<string, MutexInterface>;

  constructor(modmail: Modmail) {
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
    const pool = Modmail.getDB();

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

  private getMutex(userID: string): MutexInterface {
    if (!this.queue.has(userID)) {
      const mutex = new Mutex();
      this.queue.set(userID, mutex);
      return mutex;
    }
    return this.queue.get(userID) as Mutex;
  }

  private static getLogger() {
    return Modmail.getLogger('events');
  }
}
