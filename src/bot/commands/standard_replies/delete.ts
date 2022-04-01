import { CommandoMessage } from 'discord.js-commando';
import { PermsUtil } from '../../../util';
import Command from '../../command';
import ModmailBot from '../..';

type Args = {
  name: string,
}

/**
 * Remove a standard reply from Modmail
 * Requirements:
 *  * Mod+
 *  * The name of the standard reply must exist
 */
export default class StandardReplyDelete extends Command {
  constructor(client: ModmailBot) {
    super(client, {
      description: 'Delete a standard reply',
      aliases: ['srrm', 'srremove'],
      group: 'standard_replies',
      memberName: 'srdelete',
      guildOnly: true,
      name: 'srdelete',
      args: [
        {
          key: 'name',
          type: 'string',
          prompt: 'What\'s the name of the standard reply you want to remove?',
        },
      ],
    });
  }

  @PermsUtil.Requires('mod')
  public async run(msg: CommandoMessage, args: Args): Promise<null> {
    const pool = ModmailBot.getDB();
    await pool.standardReplies.remove(args.name);
    await msg.react('✅');
    return null;
  }
}
