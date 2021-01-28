import { RoleLevel } from 'modmail-types';
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
  public async run(msg: CommandoMessage, args: Args): Promise<null> {
    const modmail = Modmail.getModmail();
    const category = await modmail.categories.getByMessage(msg);

    if (category === null) {
      const res = 'Please use this command in a guild with an active category.';
      LogUtil.cmdWarn(msg, res);
      msg.say(res);
      return null;
    }

    category.unmute(args.userID);
    msg.say('Unmuted.');
    return null;
  }
}
