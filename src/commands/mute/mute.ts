import { Command, CommandoMessage } from 'discord.js-commando';
import { RoleLevel } from '@Floor-Gang/modmail-types';
import Modmail from '../../Modmail';
import LogUtil from '../../util/Logging';
import { Requires } from '../../util/Perms';
import Time from '../../util/Time';

type Args = {
  userID: string,
  time: string,
  reason: string[],
}

export default class Mute extends Command {
  constructor(client: Modmail) {
    super(client, {
      name: 'mute',
      aliases: [],
      description: 'Mute a member',
      guildOnly: true,
      group: 'muting',
      memberName: 'mute',
      args: [
        {
          key: 'userID',
          prompt: 'The user ID to mute',
          type: 'string',
        },
        {
          key: 'time',
          prompt: 'How long to mute them (format: 5d | 5hr | 5m | 5s)',
          type: 'string',
        },
        {
          key: 'reason',
          prompt: 'Reason for mute',
          type: 'string',
          infinite: true,
        },
      ],
    });
  }

  @Requires(RoleLevel.Mod)
  public async run(msg: CommandoMessage, args: Args): Promise<null> {
    const modmail = Modmail.getModmail();
    const category = await modmail.categories.getByGuild(msg.guild?.id || '');
    const [userID, time] = Mute.fuzzy(args);

    if (category === null) {
      const res = 'Please run this command in a guild with an active category.';
      LogUtil.cmdWarn(msg, res);
      await msg.say(res);
      return null;
    }
    const till = Time.parse(time);
    const reason = args.reason.length > 0 ? args.reason.join(' ') : undefined;
    const muted = await category.mute(
      userID,
      till,
      reason,
    );

    if (!muted) {
      await msg.say('Already muted.');
      return null;
    }
    await msg.say('Muted.');
    return null;
  }

  private static fuzzy(args: Args): [string, string] {
    // check if the time is an ID
    if (args.userID.startsWith('<@') || (/^\d+$/g).test(args.userID)) {
      return [args.userID.replace(/[^0-9]/g, ''), args.time];
    }
    // [userID, time]
    return [args.time, args.userID.replace(/[^0-9]/g, '')];
  }
}
