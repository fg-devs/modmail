import { RoleLevel } from '@newcircuit/modmail-types';
import { CommandoMessage } from 'discord.js-commando';
import { PermsUtil, LogUtil } from '../../../util';
import Command from '../../command';
import ModmailBot from '../..';

type Args = {
  userID: string,
}

/**
 * Unmute a member from a category early
 * Requirements:
 *  * Mod+
 *  * Must be used in a Discord guild that is being used as a Modmail category
 */
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

  @PermsUtil.Requires(RoleLevel.Mod)
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
