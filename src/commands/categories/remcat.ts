import { Message } from 'discord.js';
import { Command, CommandoMessage } from 'discord.js-commando';
import { RoleLevel } from 'modmail-types';
import Modmail from '../../Modmail';
import { Requires } from '../../util/Perms';
import LogUtil from '../../util/Logging';

type CatArgs = {
  id: string;
}

export default class RemoveCategory extends Command {
  constructor(client: Modmail) {
    super(client, {
      name: 'remcat',
      aliases: ['remcat', 'rc', 'rm'],
      description: 'Remove a category',
      group: 'category',
      guildOnly: true,
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
  public async run(msg: CommandoMessage, args: CatArgs): Promise<null> {
    const pool = Modmail.getDB();
    const { id } = args;

    try {
      await pool.categories.setActive(id, false);
      msg.say('Disabled category.');
    } catch (err) {
      LogUtil.cmdWarn(msg, err);
      msg.say(`Couldn't find category "${id}"`);
    } finally {
      return null;
    }
  }
}
