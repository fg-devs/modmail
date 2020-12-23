import { Message } from 'discord.js';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import IssueHandler from '../../events/IssueHandler';
import { RoleLevel } from '../../models/types';
import Modmail from '../../Modmail';
import { Requires } from '../../util/Perms';

type CatArgs = {
  id: string;
}

export default class RemoveCategory extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'remcat',
      aliases: ['remcat', 'rc', 'rm'],
      description: 'Remove a category',
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

  @Requires(RoleLevel.Admin)
  public async run(msg: CommandoMessage, args: CatArgs): Promise<Message | Message[] | null> {
    const pool = await Modmail.getDB();
    const { id } = args;

    try {
      await pool.categories.setActive(id, false);
      return msg.say('Disabled category.');
    } catch (e) {
      IssueHandler.onCommandError(msg.command, e, msg);
      return msg.say(`Couldn't find category "${id}"`);
    }
  }
}
