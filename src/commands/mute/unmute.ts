import { Message } from 'discord.js';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import { CategoryResolvable } from '../../models/types';
import Modmail from '../../Modmail';

type Args = {
  userID: string,
}

export default class Unmute extends Command {
  constructor(client: CommandoClient) {
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

  public async run(msg: CommandoMessage, args: Args): Promise<Message | Message[] | null> {
    const pool = await Modmail.getDB();

    try {
      const cat = await pool.categories.fetch(
        CategoryResolvable.guild,
        msg.guild.id,
      );

      await pool.mutes.delete(args.userID, cat.id);
      return msg.say('Unmuted.');
    } catch (e) {
      if (e.message.includes('resolve')) {
        return msg.say('Please use this command in a guild that uses modmail.');
      }
      return msg.say(e.message);
    }
  }
}
