import { RoleLevel } from '@Floor-Gang/modmail-types';
import { CommandoMessage } from 'discord.js-commando';
import { Command, ModmailBot } from '../../';
import { Requires } from '../../../../util/Perms';
import LogUtil from '../../../../util/Logging';

type Args = {
  userID: string,
}

export default class Unmute extends Command {
  constructor(client: ModmailBot) {
    super(client, {
      name: 'unmute',
      aliases: [],
      description: 'Unmute a member',
      guildOnly: true,
      group: 'muting',
      memberName: 'unmute',
      args: [
        {
          key: 'userID',
          prompt: 'What\'s the ID of the user you want to unmute?',
          type: 'string',
        },
      ],
    });
  }

  @Requires(RoleLevel.Mod)
  public async run(msg: CommandoMessage, args: Args): Promise<null> {
    const modmail = ModmailBot.getModmail();
    const category = await modmail.categories.getByGuild(msg.guild?.id || '');
    const userID = args.userID.replace(/[^0-9]/g, '');

    if (category === null) {
      const res = 'Please use this command in a guild with an active category.';
      LogUtil.cmdWarn(msg, res);
      await msg.say(res);
      return null;
    }

    await category.unmute(userID);
    await msg.say('Unmuted.');
    return null;
  }
}
