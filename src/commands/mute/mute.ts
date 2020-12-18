import { Message } from 'discord.js';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import { CategoryResolvable, MuteStatus } from '../../models/types';
import Modmail from '../../Modmail';
import Time from '../../util/Time';

type Args = {
  userID: string,
  time: string,
  reason: string[],
}

export default class Mute extends Command {
  constructor(client: CommandoClient) {
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
          default: '',
          infinite: true,
        },
      ],
    });
  }

  public async run(msg: CommandoMessage, _args: Args): Promise<Message | Message[] | null> {
    const pool = await Modmail.getDB();

    try {
      const mute = await Mute.parseArgs(msg, _args);
      await pool.mutes.add(mute);
      return msg.say('Muted.');
    } catch (e) {
      console.error(e);
      return msg.say(e.message);
    }
  }

  private static async parseArgs(msg: CommandoMessage, args: Args): Promise<MuteStatus> {
    const pool = await Modmail.getDB();
    const res: MuteStatus = {
      category: '',
      reason: args.reason.join(' '),
      till: Time.parse(args.time),
      user: args.userID,
    };
    // get the category
    try {
      const cat = await pool.categories.fetch(
        CategoryResolvable.guild,
        msg.guild.id,
      );
      res.category = cat.id;

      return res;
    } catch (e) {
      throw new Error('Please use this command in a guild that has a category.');
    }
  }
}
