import {
  DMChannel, GuildMember, Message, TextChannel,
} from 'discord.js';
import Modmail from '../Modmail';
import Embeds from '../util/Embeds';
import { CONFIG } from '../globals';
import MessageController from '../controllers/messages';

export default class EventHandler {
  private readonly modmail: Modmail;

  private readonly messages: MessageController

  constructor(modmail: Modmail, messages: MessageController) {
    this.modmail = modmail;
    this.messages = messages;
  }

  /**
   * onMessage is called when a new message appears that the bot can see
   * @param {Message} msg
   */
  public async onMessage(msg: Message): Promise<void> {
    if (!msg.author.bot && !msg.content.startsWith(CONFIG.prefix)) {
      if (msg.channel.type === 'dm') {
        await this.messages.handleDM(msg);
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
   * @param {Message} msg
   */
  public async onMessageDelete(msg: Message): Promise<void> {
    const pool = this.modmail.getDB();

    if (!msg.author.bot && !msg.content.startsWith(CONFIG.prefix)) {
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
   * @param {Message} oldMsg
   * @param {Message} newMsg
   */
  public async onMessageEdit(oldMsg: Message, newMsg: Message): Promise<void> {
    const pool = this.modmail.getDB();

    if (newMsg.channel instanceof DMChannel && !newMsg.author.bot) {
      const thread = await pool.threads.getCurrentThread(newMsg.author.id);
      if (thread === null) {
        return;
      }
      await this.messages.editMessage(oldMsg, newMsg, thread);
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
   * @param {GuildMember} member
   */
  public async onMemberLeave(member: GuildMember): Promise<void> {
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
      const embed = Embeds.memberLeft(member);
      await (channel as TextChannel).send(embed);
    }
  }

  private getLogger() {
    return Modmail.getLogger('events');
  }
}
