import { CommandoMessage } from 'discord.js-commando';
import { RoleLevel } from '@NewCircuit/modmail-types';
import { Command } from '../../';
import ModmailBot from '../../../bot';
import { LogUtil, PermsUtil } from '../../../util';

type Args = {
  id: string,
  emoji: string,
}

export default class SetEmote extends Command {
  constructor(client: ModmailBot) {
    super(client, {
      name: 'setemote',
      aliases: ['se'],
      description: 'Set emote for a category',
      group: 'category',
      guildOnly: true,
      memberName: 'setemote',
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

  @PermsUtil.Requires(RoleLevel.Admin)
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
