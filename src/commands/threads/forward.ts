/* eslint-disable no-await-in-loop */
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import { Message } from 'discord.js';
import Modmail from '../../Modmail';
import Categories from '../../util/Categories';
import Embeds from '../../util/Embeds';
import { CLOSE_THREAD_DELAY } from '../../globals';

export default class Forward extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'forward',
      description: 'Forward a thread to a new category',
      group: 'threads',
      memberName: 'forward',
      guildOnly: true,
    });
  }

  public async run(msg: CommandoMessage): Promise<Message | Message[] | null> {
    const pool = await Modmail.getDB();
    const selectorRes = await Categories.categorySelector(
      pool.categories,
      msg.channel,
      msg.author,
      this.client,
    );

    const thread = await pool.threads.getThreadByChannel(msg.channel.id);
    if (thread === null) {
      return msg.reply('not in a thread');
    }

    const user = await this.client.users.fetch(thread.author.id, true, true);
    const pastMessages = await pool.messages.getPastMessages(thread.id);

    const newChannel = await selectorRes.guild.channels.create(
      `${user.username}-${user.discriminator}`,
      {
        type: 'text',
      },
    );
    await newChannel.setParent(selectorRes.category);
    await pool.threads.updateThread(thread.id, newChannel.id, selectorRes.id);
    await newChannel.send(Embeds.forwardedBy(msg.author, selectorRes.name));

    for (let i = 0; i < pastMessages.length; i += 1) {
      const message = pastMessages[i];
      let embed;
      const author = await this.client.users.fetch(message.sender, true, true);
      if (message.internal) {
        embed = Embeds.internalMessage(message.content, author);
      } else if (message.sender === thread.author.id) {
        embed = Embeds.messageReceived(message.content, author);
      } else {
        embed = Embeds.messageSend(message.content, author);
      }

      const newMessage = await newChannel.send(embed);
      await pool.messages.update(message.modmailID, newMessage.id);
    }

    const successEmbed = Embeds.successfulForward();
    await msg.channel.send(successEmbed);

    await new Promise((r) => setTimeout(r, CLOSE_THREAD_DELAY));
    await msg.channel.delete('Thread forwarded');

    return null;
  }
}
