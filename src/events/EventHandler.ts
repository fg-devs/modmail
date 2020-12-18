import {
  DMChannel, Guild, GuildMember, Message, TextChannel,
} from 'discord.js';
import { CommandoClient } from 'discord.js-commando';
import ThreadHandler from './ThreadHandling';
import Modmail from '../Modmail';
import Embeds from '../util/Embeds';
import { CONFIG } from '../globals';

export default class EventHandler {
  private readonly client: CommandoClient

  constructor(client: CommandoClient) {
    this.client = client;
  }

  /**
   * Called on message
   * @param {Message} msg
   */
  public async onMessage(msg: Message): Promise<void> {
    const pool = await Modmail.getDB();

    if (!msg.author.bot && !msg.content.startsWith(CONFIG.prefix)) {
      if (msg.channel.type === 'dm') {
        const thread = await pool.threads.getCurrentThread(msg.author.id);

        if (thread !== null) {
          await ThreadHandler.clientSendMessage(this.client, msg, thread, pool);
        } else {
          await ThreadHandler.createNewThread(pool, this.client, msg);
        }
      } else {
        const thread = await pool.threads.getThreadByChannel(msg.channel.id);

        if (thread === null) {
          return;
        }

        await pool.messages.add({
          clientID: null,
          content: msg.content,
          edits: [],
          files: [],
          internal: true,
          isDeleted: false,
          modmailID: msg.id,
          sender: msg.author.id,
          threadID: thread.id,
        });
      }
    }
  }

  /**
   * Called on ready
   */
  public async onReady(): Promise<void> {
    console.log('Bot is ready');
    this.client.user?.setPresence({
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
    const pool = await Modmail.getDB();
    if (!msg.author.bot) {
      const thread = await pool.threads.getCurrentThread(msg.author.id);
      if (thread === null) {
        return;
      }

      if (msg.channel instanceof DMChannel) {
        await ThreadHandler.messageDeleted(this.client, msg, pool, thread);
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
    const pool = await Modmail.getDB();

    if (newMsg.channel instanceof DMChannel && !newMsg.author.bot) {
      await ThreadHandler.messageEdit(this.client, oldMsg, newMsg, pool);
    }
  }

  /**
   * Called on member join
   * @param {GuildMember} member
   */
  public async onMemberJoin(member: GuildMember): Promise<void> {
    const pool = await Modmail.getDB();
    const thread = await pool.threads.getCurrentThread(member.id);
    if (thread === null) {
      return;
    }

    const channel = await this.client.channels.fetch(thread.channel, true, true) as TextChannel;
    const embed = Embeds.memberJoined(member);
    await channel.send(embed);
  }

  /**
   * Called on member leave
   * @param {GuildMember} member
   */
  public async onMemberLeave(member: GuildMember): Promise<void> {
    const pool = await Modmail.getDB();
    const thread = await pool.threads.getCurrentThread(member.id);
    if (thread === null) {
      return;
    }

    const channel = await this.client.channels.fetch(thread.channel, true, true) as TextChannel;
    const embed = Embeds.memberLeft(member);
    await channel.send(embed);
  }
}
