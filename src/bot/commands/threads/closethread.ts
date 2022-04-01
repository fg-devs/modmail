import { CommandoMessage } from 'discord.js-commando';
import { LogUtil } from '../../../util';
import Command from '../../command';
import ModmailBot from '../..';

/**
 * Close a thread
 * Requirements:
 *  * Must be used in a thread text-channel
 */
export default class CloseThread extends Command {
  constructor(client: ModmailBot) {
    super(client, {
      name: 'closethread',
      aliases: ['close', 'exit'],
      description: 'Close a thread',
      guildOnly: true,
      group: 'threads',
      memberName: 'close',
    });
  }

  public async run(msg: CommandoMessage): Promise<null> {
    const modmail = ModmailBot.getModmail();
    const thread = await modmail.threads.getByChannel(msg.channel.id);

    if (thread === null) {
      const res = 'Not currently in a thread';
      LogUtil.cmdWarn(msg, res);
      await msg.say(res);
      return null;
    }

    await thread.close();
    return null;
  }
}
