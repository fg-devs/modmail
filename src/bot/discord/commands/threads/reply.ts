import { CommandoMessage } from 'discord.js-commando';
import { Command } from '../../';
import ModmailBot from '../../../bot';

/**
 * Send a message to the member of a thread
 * Requirements:
 *  * Must be used in a thread text-channel
 */
export default class Reply extends Command {
  constructor(client: ModmailBot) {
    super(client, {
      name: 'reply',
      aliases: ['r'],
      description: 'Reply to a user in modmail',
      group: 'threads',
      memberName: 'reply',
      guildOnly: true,
      args: [
        {
          key: 'content',
          prompt: 'What\'s the message you want to send?',
          type: 'string',
          infinite: true,
          default: [],
        },
      ],
    });
  }

  public async run(msg: CommandoMessage): Promise<null> {
    const modmail = ModmailBot.getModmail();
    const thread = await modmail.threads.getByChannel(msg.channel.id);

    if (thread !== null) {
      await thread.sendMsg(msg, false);
    } else {
      await msg.reply('This is not an active thread.');
    }
    return null;
  }
}
