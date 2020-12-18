import { CommandoClient } from 'discord.js-commando';
import {
  DMChannel, Message, TextChannel,
} from 'discord.js';
import Categories, { CatSelector } from '../util/Categories';
import Embeds from '../util/Embeds';
import { Thread } from '../models/types';
import { IDatabaseManager } from '../models/interfaces';

export default class ThreadHandler {
  /**
  * This is used whenever a user send a message to the bot
  * @param {DatabaseManager} pool
  * @param {CommandoClient} client
  * @param {Message} msg The message that gets send to modmail
  * @returns {Promise<void>}
  */
  public static async createNewThread(
    pool: IDatabaseManager,
    client: CommandoClient,
    msg: Message,
  ): Promise<void> {
    if (msg.channel instanceof DMChannel && msg.author.dmChannel === null) {
      await msg.author.createDM();
    }
    let selectorRes: CatSelector;

    try {
      selectorRes = await Categories.categorySelector(
        pool.categories,
        msg.channel as DMChannel,
        msg.author,
        client,
      );
      const isMuted = await pool.mutes.isMuted(msg.author.id, selectorRes.id);

      if (isMuted) {
        throw new Error("You're muted from this category.");
      }
    } catch (e) {
      await msg.reply(e.message);
      return;
    }

    const channel = await selectorRes.guild.channels.create(
      `${msg.author.username}-${msg.author.discriminator}`,
      { type: 'text' },
    );
    const member = await selectorRes.guild.members.fetch(msg.author.id);
    if (member === undefined) {
      return;
    }

    await channel.setParent(selectorRes.category);
    await channel.send(await Embeds.memberDetails(pool.threads, member));
    await channel.send(Embeds.newThread(member.user));
    await pool.users.create(msg.author.id);

    try {
      await pool.threads.open(msg.author.id, channel.id, selectorRes.id);
      const thread = await pool.threads.getCurrentThread(msg.author.id);
      if (thread !== null) {
        await ThreadHandler.clientSendMessage(client, msg, thread, pool);
      }
    } catch (_) {
      await channel.delete('Dupe thread');
    }
  }

  /**
   * This is used whenever a user send a message to the bot
   * @param {CommandoClient} client
   * @param {Message} msg The message that gets send to modmail
   * @param {Thread} thread
   * @param {IDatabaseManager} pool
   * @returns {Promise<void>}
   */
  public static async clientSendMessage(
    client: CommandoClient,
    msg: Message,
    thread: Thread,
    pool: IDatabaseManager,
  ): Promise<void> {
    const channel = await client.channels.fetch(
      thread.channel,
      true,
      true,
    ) as TextChannel;
    const modmailMessage = await channel.send(Embeds.messageReceived(msg.content, msg.author));

    await msg.react('✅');
    await pool.messages.add({
      clientID: msg.id,
      content: msg.content,
      edits: [],
      files: [],
      isDeleted: false,
      internal: false,
      modmailID: modmailMessage.id,
      sender: msg.author.id,
      threadID: thread.id,
    });
  }

  public static async messageDeleted(
    client: CommandoClient,
    msg: Message,
    pool: IDatabaseManager,
    thread: Thread,
  ): Promise<void> {
    const channel = await client.channels.fetch(
      thread.channel,
      true,
      true,
    ) as TextChannel;
    const databaseMessageID = await pool.messages.fetch(msg.id);
    const modmailMessage = await channel.messages.fetch(databaseMessageID.modmailID);
    const embed = modmailMessage.embeds[0];
    embed.footer = {
      text: 'Deleted',
    };

    await modmailMessage.edit(embed);
    await pool.messages.setDeleted(msg.id);
  }

  public static async messageEdit(
    client: CommandoClient,
    oldMsg: Message,
    newMsg: Message,
    pool: IDatabaseManager,
  ): Promise<void> {
    const thread = await pool.threads.getCurrentThread(newMsg.author.id);
    if (thread === null) {
      return;
    }

    const channel = await client.channels.fetch(
      thread.channel,
      true,
      true,
    ) as TextChannel;

    const dmChannel = newMsg.author.dmChannel || await newMsg.author.createDM();
    const databaseMessageID = await pool.messages.fetch(newMsg.id);

    if (databaseMessageID.clientID === null) {
      return;
    }

    const modmailMessage = await channel.messages.fetch(databaseMessageID.modmailID);
    const clientMessage = await dmChannel.messages.fetch(databaseMessageID.clientID);

    const embed = modmailMessage.embeds[0];
    embed.description = newMsg.content;
    embed.addField(`Version ${embed.fields.length + 1}: `, oldMsg.content, false);

    await modmailMessage.edit(embed);
    await clientMessage.react('✏️');
    await pool.edits.add({
      content: newMsg.content,
      message: databaseMessageID.modmailID,
      version: 0,
    });
  }
}
