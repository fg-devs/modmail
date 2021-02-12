import { Command, CommandoMessage } from 'discord.js-commando';
import { RoleLevel } from '@Floor-Gang/modmail-types';
import Modmail from '../../Modmail';
import LogUtil from '../../util/Logging';
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
      guildOnly: true,
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
  public async run(msg: CommandoMessage, args: Args): Promise<null> {
    const modmail = Modmail.getModmail();
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
