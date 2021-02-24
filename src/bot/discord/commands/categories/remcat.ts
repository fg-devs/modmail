import { CommandoMessage } from 'discord.js-commando';
import { RoleLevel } from '@Floor-Gang/modmail-types';
import { Command, } from '../../';
import ModmailBot from '../../../bot';
import { PermsUtil, LogUtil } from '../../../util';

type CatArgs = {
  emoji: string;
}

export default class RemoveCategory extends Command {
  constructor(client: ModmailBot) {
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
          prompt: 'What\'s the emoji of the category to remove?',
          type: 'string',
        },
      ],
    });
  }

  @PermsUtil.Requires(RoleLevel.Admin)
  public async run(msg: CommandoMessage, args: CatArgs): Promise<null> {
    const modmail = ModmailBot.getModmail();
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
