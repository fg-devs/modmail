/* eslint-disable max-len */
import { CommandoClient } from 'discord.js-commando';
import { Message, TextChannel } from 'discord.js';
import Categories from '../util/Categories';
import Embeds from '../util/Embeds';
import { Thread } from '../models/types';
import { IDatabaseManager } from '../models/interfaces';

export default class ThreadHandler {
  /**
  * This is used whenever a user send a message to the bot
  * @param {DatabaseManager} pool
  * @param {CommandoClient} client
  * @param {Message} msg The message that gets send to modmail
  * @returns {void}
  */
  public static async createNewThread(pool: IDatabaseManager, client: CommandoClient, msg: Message): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const selectorRes = await Categories.categorySelector(pool, msg.channel, msg.author, client);
    if (selectorRes === undefined) {
      return;
    }

    const channel = await selectorRes.guild.channels.create(`${msg.author.username}-${msg.author.discriminator}`, {
      type: 'text',
    });
    const member = selectorRes.guild.members.cache.get(msg.author.id);
    if (member === undefined) {
      return;
    }

    await channel.setParent(selectorRes.category);
    await channel.send(await Embeds.memberDetails(pool.threads, member));

    await pool.users.create(msg.author.id);
    await pool.threads.open(msg.author.id, channel.id, selectorRes.id);

    const thread = await pool.threads.getCurrentThread(msg.author.id);

    if (thread === undefined) {
      return;
    }

    await ThreadHandler.clientSendMessage(pool, client, msg, thread);
  }

  /**
   * This is used whenever a user send a message to the bot
   * @param {DatabaseManager} pool
   * @param {CommandoClient} client
   * @param {Message} msg The message that gets send to modmail
   * @param {Thread} thread
   * @returns {void}
   */
  public static async clientSendMessage(pool: IDatabaseManager, client: CommandoClient, msg: Message, thread: Thread): Promise<void> {
    const channel = await client.channels.fetch(thread.channel, true, true) as TextChannel;
    await channel.send(Embeds.messageReceived(msg.content, msg.author));

    await msg.react('✅');
  }
}
