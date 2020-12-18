import { Message } from 'discord.js';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import Modmail from '../../Modmail';

type Args = {
  id: string,
  emoji: string,
}

export default class SetEmote extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'setemote',
      aliases: ['se'],
      description: 'Set emote for a category',
      // TODO(dylan): Add a proper permission system.
      ownerOnly: true,
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

  public async run(msg: CommandoMessage, args: Args): Promise<Message | Message[] | null> {
    const pool = await Modmail.getDB();

    try {
      await pool.categories.setEmote(args.id, args.emoji);
      return msg.say('Updated.');
    } catch (e) {
      console.error(e);
      return msg.say(e.message);
    }
  }
}
