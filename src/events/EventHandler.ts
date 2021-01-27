import { Mutex, MutexInterface } from 'async-mutex';
import {
  DMChannel, GuildMember, Message, PartialGuildMember, PartialMessage, TextChannel,
} from 'discord.js';
import Modmail from '../Modmail';
import Embeds from '../util/Embeds';
import { CONFIG } from '../globals';
import MessageController from '../controllers/messages';

export default class EventHandler {
  private readonly modmail: Modmail;

  private readonly messages: MessageController

  private readonly queue: Map<string, MutexInterface>;

  constructor(modmail: Modmail, messages: MessageController) {
    this.modmail = modmail;
    this.messages = messages;
    this.queue = new Map<string, MutexInterface>();
  }

  /**
   * onMessage is called when a new message appears that the bot can see
   * @param {Message} msg
   */
  public async onMessage(msg: Message): Promise<void> {
    if (!msg.author.bot && !msg.content.startsWith(CONFIG.bot.prefix)) {
      if (msg.channel.type === 'dm') {
        const mutex = this.getMutex(msg.author.id);
        const release = await mutex.acquire();
        await this.messages.handleDM(msg);
        release();
      } else {
        await this.messages.handle(msg);
      }
    }
  }

  /**
   * Called on ready
   */
  public async onReady(): Promise<void> {
    const log = this.getLogger();
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
    const pool = this.modmail.getDB();

    if (msg.partial) {
      return;
    }

    if (!msg.author.bot && !msg.content.startsWith(CONFIG.bot.prefix)) {
      const thread = await pool.threads.getCurrentThread(msg.author.id);
      if (thread === null) {
        return;
      }

      if (msg.channel instanceof DMChannel) {
        await this.messages.markAsDeleted(msg, thread);
      } else {
        await pool.messages.setDeleted(msg.id);
      }
    }
  }

  /**
   * Called on message edit
   * @param {Message | PartialMessage} oldMsg
   * @param {Message | PartialMessage} newMsg
   */
  public async onMessageEdit(
    oldMsg: Message | PartialMessage,
    newMsg: Message | PartialMessage,
  ): Promise<void> {
    const pool = this.modmail.getDB();

    if (oldMsg.partial || newMsg.partial) {
      return;
    }

    if (newMsg.channel instanceof DMChannel && !newMsg.author.bot) {
      const thread = await pool.threads.getCurrentThread(newMsg.author.id);
      if (thread === null) {
        return;
      }
      await this.messages.editMessage(oldMsg, newMsg, thread);
      await newMsg.react('✏');
    }
  }

  /**
   * Called on member join
   * @param {GuildMember} member
   */
  public async onMemberJoin(member: GuildMember): Promise<void> {
    const pool = this.modmail.getDB();
    const thread = await pool.threads.getCurrentThread(member.id);

    if (thread === null) {
      return;
    }

    const channel = await this.modmail.channels.fetch(
      thread.channel,
      true,
      true,
    );

    if (channel) {
      const embed = Embeds.memberJoined(member);
      await (channel as TextChannel).send(embed);
    }
  }

  /**
   * Called on member leave
   * @param {GuildMember | PartialGuildMember} member
   */
  public async onMemberLeave(
    member: GuildMember | PartialGuildMember,
  ): Promise<void> {
    const pool = this.modmail.getDB();
    const thread = await pool.threads.getCurrentThread(member.id);

    if (thread === null || member.partial) {
      return;
    }

    const channel = await this.modmail.channels.fetch(
      thread.channel,
      true,
      true,
    );

    if (channel) {
      const embed = Embeds.memberLeft(member);
      await (channel as TextChannel).send(embed);
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

  private getLogger() {
    return Modmail.getLogger('events');
  }
}
