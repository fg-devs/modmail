import { CommandoMessage } from 'discord.js-commando';
import { RoleLevel } from '@newcircuit/modmail-types';
import { Command } from '../../';
import { LogUtil, PermsUtil } from '../../../util';
import ModmailBot from '../../../bot';

type Args = {
  id: string,
  emoji: string,
}

/**
 * Set a new unique emoji for a category
 * Requirements:
 *  * Owner
 */
export default class SetEmoji extends Command {
  constructor(client: ModmailBot) {
    super(client, {
      name: 'setemoji',
      aliases: ['se'],
      description: 'Set emote for a category',
      group: 'category',
      guildOnly: true,
      ownerOnly: true,
      memberName: 'setemoji',
      args: [
        {
          key: 'id',
          prompt: 'What\'s category ID that you want to update?',
          type: 'string',
        },
        {
          key: 'emoji',
          prompt: 'What\'s the new emoji?',
          type: 'string',
        },
      ],
    });
  }

  public async run(msg: CommandoMessage, args: Args): Promise<null> {
    const modmail = ModmailBot.getModmail();
    const category = await modmail.categories.getByID(args.id);

    if (category !== null) {
      await category.setEmoji(args.emoji);
      await msg.say('Updated.');
      return null;
    }

    LogUtil.cmdWarn(
      msg,
      `Couldn't set emoji "${args.emoji}" for category ${args.id}`
      + " because it doesn't exist",
    );
    await msg.say("That category doesn't exist.");
    return null;
  }
}
