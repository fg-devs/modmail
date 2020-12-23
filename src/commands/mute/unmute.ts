import { Message } from 'discord.js';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import IssueHandler from '../../events/IssueHandler';
import { RoleLevel } from '../../models/types';
import Modmail from '../../Modmail';
import Categories from '../../util/Categories';
import { Requires } from '../../util/Perms';

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

  @Requires(RoleLevel.Mod)
  public async run(msg: CommandoMessage, args: Args): Promise<Message | Message[] | null> {
    const pool = await Modmail.getDB();
    const category = await Categories.getCategory(msg);

    if (category === null) {
      const res = 'Please use this command in a guild with an active category.';
      IssueHandler.onCommandWarn(msg, res);
      return msg.say(res);
    }

    await pool.mutes.delete(args.userID, category.id);
    return msg.say('Unmuted.');
  }
}
