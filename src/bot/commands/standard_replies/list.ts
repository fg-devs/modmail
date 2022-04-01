import { CommandoMessage } from 'discord.js-commando';
import { MessageAttachment } from 'discord.js';
import { PermsUtil } from '../../../util';
import Command from '../../command';
import ModmailBot from '../..';

/**
 * List all the standard replies
 * Requirements:
 *  * Mod+
 */
export default class StandardReplyList extends Command {
  constructor(client: ModmailBot) {
    super(client, {
      description: 'list all standard replies',
      group: 'standard_replies',
      aliases: ['srls', 'srs', 'standardreplies'],
      memberName: 'srlist',
      guildOnly: true,
      name: 'srlist',
      args: [],
    });
  }

  @PermsUtil.Requires('mod')
  public async run(msg: CommandoMessage): Promise<null> {
    const pool = ModmailBot.getDB();
    const srs = await pool.standardReplies.fetchAll();
    let res = 'Standard Replies\n\n';

    for (let i = 0; i < srs.length; i += 1) {
      const sr = srs[i];
      res += `Name: ${sr.name}\n${sr.reply}\n\n`;
    }

    const attachment = new MessageAttachment(
      Buffer.from(res),
      'standard_replies.txt',
    );

    await msg.reply('Here are all the standard replies', attachment);

    return null;
  }
}
