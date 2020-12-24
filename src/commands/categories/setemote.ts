import { Message } from 'discord.js';
import { CommandoMessage } from 'discord.js-commando';
import { RoleLevel } from '../../models/types';
import Modmail from '../../Modmail';
import Command from '../../models/command';
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
  public async run(msg: CommandoMessage, args: Args): Promise<Message | Message[] | null> {
    const pool = this.modmail.getDB();

    try {
      await pool.categories.setEmote(args.id, args.emoji);
      return msg.say('Updated.');
    } catch (_) {
      const res = "That category doesn't exist.";
      this.logWarning(msg, res);
      return msg.say(res);
    }
  }
}
