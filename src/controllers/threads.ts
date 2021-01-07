import {
  Message as MMMessage,
  MuteStatus,
  Thread,
} from 'modmail-types';
import {
  DMChannel,
  Message,
  TextChannel,
} from 'discord.js';
import Controller from '../models/controller';
import Modmail from '../Modmail';
import { CatSelector } from '../util/Categories';
import Embeds from '../util/Embeds';
import Time from '../util/Time';
import LogUtil from '../util/Logging';
import AttachmentController from './attachments';

export default class ThreadController extends Controller {
  private readonly attachments: AttachmentController;

  constructor(modmail: Modmail) {
    super(modmail, 'threads');

    this.attachments = new AttachmentController(modmail);
  }

  /**
   * Create a new thread
   * @param {Message} msg Message sent by user in a DM
   */
  public async create(msg: Message): Promise<void> {
    if (msg.channel instanceof DMChannel && msg.author.dmChannel === null) {
      await msg.author.createDM();
    }

    const sel = await this.handleSelector(msg);

    if (sel === null) {
      await msg.react('❌');
      return;
    }

    const pool = Modmail.getDB();
    const channel = await this.createChannel(msg, sel);

    if (channel === null) {
      await msg.react('❌');
      return;
    }

    try {
      let thread = await pool.threads.getCurrentThread(msg.author.id);
      if (thread !== null) {
        await this.sendMessage(msg, thread);
        return;
      }
      thread = await pool.threads.open(
        msg.author.id,
        channel.id,
        sel.id,
      );
      await this.sendMessage(msg, thread);
    } catch (err) {
      const log = this.getLogger();
      log.error(`Removing dupe thread\n${LogUtil.breakDownErr(err)}`);
      await channel.delete('Dupe thread');
    }
  }

  /**
   * Send a user's message to an active thread
   * @param {Message} msg The user's message
   * @param {Thread} thread The active thread
   */
  public async sendMessage(msg: Message, thread: Thread): Promise<void> {
    const pool = Modmail.getDB();
    const log = this.getLogger();

    try {
      const thMsgEmbed = Embeds.messageReceived(
        msg.content,
        msg.author,
      );
      const thChan = await this.modmail.channels.fetch(thread.channel);
      const thChannel = thChan as TextChannel;
      const thMessage = await thChannel.send(thMsgEmbed);

      // Modmail message
      const mmmsg: MMMessage = {
        clientID: msg.id,
        content: msg.content,
        edits: [],
        files: [],
        isDeleted: false,
        internal: false,
        modmailID: thMessage.id,
        sender: msg.author.id,
        threadID: thread.id,
      };

      await pool.messages.add(mmmsg);
      await this.attachments.handle(msg, thChannel, thMessage.id);
      await msg.react('✅');
    } catch (err) {
      log.error(
        `Failed to send message from ${msg.author.tag} to ${thread.id}
${LogUtil.breakDownErr(err)}`,
      );
    }
  }

  /**
   * Handle the selection process. This allows the user to choose what
   * category they want to contact
   * @param {Message} msg The user's message
   * @returns {Promise<CatSelector | null>} null if the selection process
   * failed
   */
  private async handleSelector(msg: Message): Promise<CatSelector | null> {
    const catUtil = Modmail.getCatUtil();
    const pool = Modmail.getDB();
    const log = this.getLogger();
    let selectorRes: null | CatSelector = null;
    let mute: null | MuteStatus = null;

    try {
      selectorRes = await catUtil.categorySelector(
        msg.channel as DMChannel,
        msg.author,
      );
      mute = await pool.mutes.fetch(
        msg.author.id,
        selectorRes.id,
      );

      if (mute) {
        const muteEmbed = Embeds.muted(
          selectorRes.name,
          mute.till,
        );
        await msg.channel.send(muteEmbed);
        return null;
      }
      return selectorRes;
    } catch (err) {
      let message = `${msg.author.tag} wasn't allowed to DM a category\n`;
      await msg.reply(err.message);

      if (selectorRes) {
        message += ` * Category: ${selectorRes.name} (${selectorRes.id})\n`;
      }
      if (mute) {
        message += ` * Muted till: ${Time.toDate(mute.till)}\n`;
      }
      message += `${LogUtil.breakDownErr(err)}\n`;

      log.warn(message);

      return null;
    }
  }

  /**
   * Create thread channel
   * @param {Message} msg Message sent by user
   * @param {CatSelector} sel The user's category selection
   * @returns {Promise<TextChannel | null>} Nullable if something went wrong
   */
  private async createChannel(
    msg: Message,
    sel: CatSelector,
  ): Promise<TextChannel | null> {
    const log = this.getLogger();
    const pool = Modmail.getDB();
    const channel = await sel.guild.channels.create(
      `${msg.author.username}-${msg.author.discriminator}`,
      { type: 'text' },
    );
    const user = await this.modmail.users.fetch(msg.author.id, true, true);

    if (user === undefined) {
      log.error(`Failed to get ${msg.author.id}, how did we get here?`);
      return null;
    }
    const userDetails = await Embeds.memberDetails(pool.threads, user);
    const threadDetails = Embeds.newThread(user);

    // setup channel and send details about the user and the thread
    await channel.setParent(sel.category);
    await channel.send(userDetails);
    await channel.send(threadDetails);

    // create user if they don't exit
    await pool.users.create(msg.author.id);

    return channel;
  }
}
