import { RoleLevel } from 'modmail-types';
import { Message } from 'discord.js';
import { Command, CommandoMessage } from 'discord.js-commando';
import Modmail from '../../Modmail';
import { Requires } from '../../util/Perms';
import LogUtil from '../../util/Logging';

type Args = {
  userID: string,
}

export default class Unmute extends Command {
  constructor(client: Modmail) {
    super(client, {
      name: 'unmute',
      aliases: [],
      description: 'Unmute a member',
      guildOnly: true,
      group: 'muting',
      memberName: 'unmute',
      args: [
        {
          key: 'userID',
          prompt: 'The user ID to unmute',
          type: 'string',
        },
      ],
    });
  }

  @Requires(RoleLevel.Mod)
  public async run(
    msg: CommandoMessage,
    args: Args,
  ): Promise<Message | Message[] | null> {
    const pool = Modmail.getDB();
    const catUtil = Modmail.getCatUtil();
    const category = await catUtil.getCategory(msg);

    if (category === null) {
      const res = 'Please use this command in a guild with an active category.';
      LogUtil.cmdWarn(msg, res);
      return msg.say(res);
    }

    await pool.mutes.delete(args.userID, category.id);
    return msg.say('Unmuted.');
  }
}
