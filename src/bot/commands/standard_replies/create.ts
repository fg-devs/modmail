import { RoleLevel } from '@newcircuit/modmail-types';
import { CommandoMessage } from 'discord.js-commando';
import { CONFIG } from '../../../globals';
import { LogUtil, PermsUtil } from '../../../util';
import Command from '../../command';
import ModmailBot from '../..';

type Args = {
  name: string,
  reply: string
}

/**
 * Create a standard reply for Modmail
 * Requirements:
 *  * Mod+
 *  * Must have a unique name for the standard reply
 */
export default class StandardReplyCreate extends Command {
  constructor(client: ModmailBot) {
    super(client, {
      description: 'create a standard reply',
      group: 'standard_replies',
      aliases: ['sradd'],
      memberName: 'srcreate',
      guildOnly: true,
      name: 'srcreate',
      args: [
        {
          key: 'name',
          type: 'string',
          prompt: 'What\'s the name of this standard reply?',
        },
        {
          key: 'reply',
          type: 'string',
          prompt: 'What\'s the actual reply message?',
        },
      ],
    });
  }

  @PermsUtil.Requires(RoleLevel.Mod)
  public async run(msg: CommandoMessage, args: Args): Promise<null> {
    const pool = ModmailBot.getDB();

    try {
      await pool.standardReplies.create(args.name, args.reply);
      await msg.say(
        'Successfully created a new standard reply'
        + `\n - Usage: \`${CONFIG.bot.prefix}sr ${args.name}\``,
      );
    } catch (err) {
      const e = err as Error;
      let res;
      if (e.message.includes('standard_replies_name_uindex')) {
        res = 'That standard reply name already is taken.';
      } else {
        res = 'An internal issue occurred.';
      }
      LogUtil.cmdError(msg, e, res);
      await msg.say(res);
    }

    return null;
  }
}
