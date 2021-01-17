import { Message } from 'discord.js';
import { Command, CommandoMessage } from 'discord.js-commando';
import { RoleLevel } from 'modmail-types';
import Modmail from '../../Modmail';
import LogUtil from '../../util/Logging';
import { Requires } from '../../util/Perms';

type Args = {
  id: string,
  emoji: string,
}

export default class SetEmote extends Command {
  constructor(client: Modmail) {
    super(client, {
      name: 'setemote',
      aliases: ['se'],
      description: 'Set emote for a category',
      group: 'category',
      guildOnly: true,
      memberName: 'setemote',
      args: [
        {
          key: 'id',
          prompt: 'The category ID to update',
          type: 'string',
        },
        {
          key: 'emoji',
          prompt: 'The new emoji',
          type: 'string',
        },
      ],
    });
  }

  @Requires(RoleLevel.Admin)
  public async run(msg: CommandoMessage, args: Args): Promise<null> {
    const pool = Modmail.getDB();

    try {
      await pool.categories.setEmote(args.id, args.emoji);
      msg.say('Updated.');
    } catch (_) {
      const res = "That category doesn't exist.";
      LogUtil.cmdWarn(msg, res);
      msg.say(res);
    } finally {
      return null;
    }
  }
}
