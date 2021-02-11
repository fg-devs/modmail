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
    const modmail = Modmail.getModmail();
    const { id } = args;
    const category = await modmail.categories.getByID(id);

    if (category !== null) {
      await category.setActive(false);
      await msg.say('Disabled category.');
      return null;
    }

    LogUtil.cmdWarn(msg, `Couldn't disable category "${id}" for ${msg.author.id}`);
    await msg.say(`Couldn't find category "${id}"`);
    return null;
  }
}
