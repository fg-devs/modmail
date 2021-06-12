import { CommandoMessage } from 'discord.js-commando';
import { TextChannel } from 'discord.js';
import { Threads } from '../../../controllers';
import { LogUtil } from '../../../util/';
import Command from '../../command';
import ModmailBot from '../../';

/**
 * Forward a thread to another category
 * Requirements:
 *  * Must be used in a thread text-channel
 */
export default class Forward extends Command {
  constructor(client: ModmailBot) {
    super(client, {
      name: 'forward',
      description: 'Forward a thread to a new category',
      group: 'threads',
      memberName: 'forward',
      guildOnly: true,
    });
  }

  public async run(msg: CommandoMessage): Promise<null> {
    const modmail = ModmailBot.getModmail();
    const thread = await modmail.threads.getByChannel(msg.channel.id);
    const channel = msg.channel as TextChannel;

    if (thread === null) {
      await msg.reply('This isn\'t a thread.');
      return null;
    }

    const user = await thread.getAuthor()
    const category = await modmail.threads.getCategory(channel, true);

    if (category === null) {
      await msg.reply('Couldn\'t get that category.');
      return null;
    }

    const muted = await category.isMuted(user.id)

    if (muted) {
      await msg.reply('The user is muted in that category.')
      return null;
    }

    const isAdminOnly = await Threads.isAdminOnly(channel, true);

    try {
      await thread.forward(msg.author, isAdminOnly, category);
      await msg.reply('Forwarded.');
      await msg.channel.delete();
    } catch (e) {
      const res = 'Something internal went wrong.';
      LogUtil.cmdError(msg, e, res);
      await msg.reply(res);
    }

    return null;
  }
}
