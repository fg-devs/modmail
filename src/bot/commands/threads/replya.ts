import { CommandoMessage } from 'discord.js-commando';
import Command from '../../command';
import ModmailBot from '../../';

/**
 * Send a message anonymously to the member of a thread
 * Requirements:
 *  * Must be used in a thread text-channel
 */
export default class ReplyA extends Command {
  constructor(client: ModmailBot) {
    super(client, {
      name: 'replya',
      aliases: ['ar', 'ra'],
      description: 'Anonymously Reply to a user in modmail',
      group: 'threads',
      memberName: 'replya',
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
      await thread.sendMsg(msg, true);
    } else {
      await msg.reply('This is not an active thread.');
    }
    return null;
  }
}
