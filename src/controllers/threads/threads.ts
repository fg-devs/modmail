import {
  MuteStatus,
} from 'modmail-types';
import {
  DMChannel,
  Message,
  TextChannel,
} from 'discord.js';
import Thread from './thread';
import Controller from '../../models/controller';
import Modmail from '../../Modmail';
import { CatSelector } from '../categories/categories';
import Embeds from '../../util/Embeds';
import Time from '../../util/Time';
import LogUtil from '../../util/Logging';
import { MAX_THREADS } from '../../globals';

export default class ThreadController extends Controller {
  constructor(modmail: Modmail) {
    super(modmail, 'threads');
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
    const numOfThreads = await pool.threads.countCategoryThreads(sel.id);

    if (MAX_THREADS <= numOfThreads) {
      await msg.reply(
        'The maximum threads have been met for this category,'
        + ' try again later.',
      );
      await msg.react('❌');
      return;
    }
    const channel = await this.createChannel(msg, sel);

    if (channel === null) {
      await msg.react('❌');
      return;
    }

    try {
      let thread = await this.getByAuthor(msg.author.id);

      if (thread !== null) {
        await thread.sendToThread(msg);
        return;
      }

      const data = await pool.threads.open(
        msg.author.id,
        channel.id,
        sel.id,
      );
      thread = new Thread(this.modmail, data);

      await thread.sendToThread(msg);
    } catch (err) {
      const log = this.getLogger();
      log.error(`Removing dupe thread\n${LogUtil.breakDownErr(err)}`);
      await channel.delete('Dupe thread');
    }
  }

  public async getByAuthor(userID: string): Promise<Thread | null> {
    const pool = Modmail.getDB();
    const data = await pool.threads.getByUser(userID);

    if (data !== null) {
      return new Thread(this.modmail, data);
    }

    return null;
  }

  public async getByChannel(channelID: string): Promise<Thread | null> {
    const pool = Modmail.getDB();
    const data = await pool.threads.getByChannel(channelID);

    if (data !== null) {
      return new Thread(this.modmail, data);
    }

    return null;
  }

  public async getByID(id: string): Promise<Thread | null> {
    const pool = Modmail.getDB();
    const data = await pool.threads.getByID(id);

    if (data !== null) {
      return new Thread(this.modmail, data);
    }

    return null;
  }

  /**
   * Handle the selection process. This allows the user to choose what
   * category they want to contact
   * @param {Message} msg The user's message
   * @returns {Promise<CatSelector | null>} null if the selection process
   * failed
   */
  private async handleSelector(msg: Message): Promise<CatSelector | null> {
    const catCtrl = this.modmail.categories;
    const pool = Modmail.getDB();
    const log = this.getLogger();
    let selectorRes: null | CatSelector = null;
    let mute: null | MuteStatus = null;

    try {
      selectorRes = await catCtrl.categorySelector(
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
    channel.send(userDetails);
    channel.send(threadDetails);
    channel.setTopic(`User ID: ${user.id}`);

    // create user if they don't exit
    await pool.users.create(msg.author.id);

    return channel;
  }
}
