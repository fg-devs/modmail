import { CommandoMessage } from 'discord.js-commando';
import { RoleLevel } from '@newcircuit/modmail-types';
import { Command } from '../../';
import ModmailBot from '../../../bot';
import { LogUtil, PermsUtil, TimeUtil } from '../../../util';

type Args = {
  userID: string,
  time: string,
  reason: string[],
}

export default class Mute extends Command {
  constructor(client: ModmailBot) {
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
          prompt: 'What\'s the ID of the user that you want to mute?',
          type: 'string',
        },
        {
          key: 'time',
          prompt: 'How long to mute them (format: 5d | 5hr | 5m | 5s)',
          type: 'string',
        },
        {
          key: 'reason',
          prompt: 'What\'s the reason for the mute?',
          type: 'string',
          infinite: true,
        },
      ],
    });
  }

  @PermsUtil.Requires(RoleLevel.Mod)
  public async run(msg: CommandoMessage, args: Args): Promise<null> {
    const modmail = ModmailBot.getModmail();
    const category = await modmail.categories.getByGuild(msg.guild?.id || '');
    const [userID, time] = Mute.fuzzy(args);

    if (category === null) {
      const res = 'Please run this command in a guild with an active category.';
      LogUtil.cmdWarn(msg, res);
      await msg.say(res);
      return null;
    }
    const till = TimeUtil.parse(time);
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

    await msg.say(
      'This user is muted, they can still talk in threads, but they won\'t be'
      + 'able to talk in this category.',
    );
    return null;
  }

  private static fuzzy(args: Args): [string, string] {
    // check if the time is an ID
    if (args.userID.startsWith('<@') || (/^\d+$/g).test(args.userID)) {
      return [args.userID.replace(/[^0-9]/g, ''), args.time];
    }
    // [userID, time]
    return [args.time.replace(/[^0-9]/g, ''), args.userID];
  }
}
