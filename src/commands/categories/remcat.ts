import { Message } from 'discord.js';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import Modmail from '../../Modmail';

type CatArgs = {
  id: string;
}

export default class RemoveCategory extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'remcat',
      aliases: ['remcat', 'rc', 'rm'],
      description: 'Remove a category',
      // TODO(dylan): Add a proper permission system.
      ownerOnly: true,
      group: 'category',
      memberName: 'remcat',
      args: [
        {
          key: 'id',
          prompt: 'The category ID to remove',
          type: 'string',
        },
      ],
    });
  }

  public async run(msg: CommandoMessage, args: CatArgs): Promise<Message | Message[] | null> {
    const pool = await Modmail.getDB();
    const { id } = args;

    try {
      await pool.categories.setActive(id, false);
      return msg.say('Disabled category.');
    } catch (e) {
      return RemoveCategory.explain(msg, args);
    }
  }

  public static async explain(
    msg: CommandoMessage,
    args: CatArgs,
  ): Promise<Message | Message[]> {
    const { id } = args;
    return msg.say(`Couldn't find category "${id}"`);
  }
}
