import { CommandoMessage } from 'discord.js-commando';
import { RoleLevel } from '@Floor-Gang/modmail-types';
import Command from '../../models/command';
import Modmail from '../../Modmail';
import { Requires } from '../../util/Perms';
import LogUtil from '../../util/Logging';

type CatArgs = {
  emoji: string;
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
          key: 'emoji',
          prompt: 'The emoji of the category to remove',
          type: 'string',
        },
      ],
    });
  }

  @Requires(RoleLevel.Admin)
  public async run(msg: CommandoMessage, args: CatArgs): Promise<null> {
    const modmail = Modmail.getModmail();
    const { emoji } = args;
    const category = await modmail.categories.getByEmoji(emoji);

    if (category !== null) {
      await category.deactivate();
      await msg.say('Disabled category.');
      return null;
    }

    LogUtil.cmdWarn(
      msg,
      `Couldn't disable category "${emoji}" for ${msg.author.id}`,
    );
    await msg.say(`Couldn't find category "${emoji}"`);
    return null;
  }
}
