import { RoleLevel } from '@Floor-Gang/modmail-types';
import { Command, CommandoMessage } from 'discord.js-commando';
import Modmail from '../../Modmail';
import { CONFIG } from '../../globals';
import { Requires } from '../../util/Perms';
import LogUtil from '../../util/Logging';

type Args = {
  name: string,
  reply: string
}

export default class StandardReplyCreate extends Command {
  constructor(client: Modmail) {
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
          prompt: 'The name of the standard reply, this will be used to send the reply',
        },
        {
          key: 'reply',
          type: 'string',
          prompt: 'The actual reply',
        },
      ],
    });
  }

  @Requires(RoleLevel.Mod)
  public async run(msg: CommandoMessage, args: Args): Promise<null> {
    const pool = Modmail.getDB();

    try {
      await pool.standardReplies.create(args.name, args.reply);
      await msg.say(
        'Successfully created a new standard reply'
        + `\n - Usage: \`${CONFIG.bot.prefix}sr ${args.name}\``,
      );
    } catch (err) {
      let res;
      if (err.message.includes('standard_replies_name_uindex')) {
        res = 'That standard reply name already is taken.';
      } else {
        res = 'An internal issue occurred.';
      }
      LogUtil.cmdError(msg, err, res);
      await msg.say(res);
    }

    return null;
  }
}
