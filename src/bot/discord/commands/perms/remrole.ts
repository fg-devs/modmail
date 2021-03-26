import { CommandoMessage } from 'discord.js-commando';
import { RoleLevel } from '@newcircuit/modmail-types';
import { Command } from '../../';
import { LogUtil, PermsUtil } from '../../../util/';
import ModmailBot from '../../../bot';

type Args = {
  roleID: string;
}

/**
 * Remove a Discord role from a Modmail category
 * Requirements:
 *  * Admin+
 *  * Must be used in a Discord guild being used as a Modmail category
 */
export default class RemoveRole extends Command {
  constructor(client: ModmailBot) {
    super(client, {
      name: 'remrole',
      aliases: ['revoke'],
      description: 'Remove a role',
      guildOnly: true,
      group: 'perms',
      memberName: 'remrole',
      args: [
        {
          key: 'roleID',
          prompt: 'What\'s the ID of the role that you want to remove',
          type: 'string',
        },
      ],
    });
  }

  @PermsUtil.Requires(RoleLevel.Admin)
  public async run(msg: CommandoMessage, args: Args): Promise<null> {
    const { roleID } = args;
    const modmail = ModmailBot.getModmail();
    const category = await modmail.categories.getByGuild(msg.guild?.id || '');

    if (category === null || !category.isActive()) {
      const res = 'This guild doesn\'t have an active category.';
      LogUtil.cmdWarn(msg, res);
      await msg.say(res);
      return null;
    }

    const pool = ModmailBot.getDB();
    const isRemoved = await pool.permissions.remove(roleID);

    if (isRemoved) {
      await msg.say('Removed role.');
    } else {
      await msg.say('Nothing was removed, are you sure the correct ID was provided?');
    }
    return null;
  }
}
