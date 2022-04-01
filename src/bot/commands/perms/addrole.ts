import { Guild, Message } from 'discord.js';
import { CommandoMessage } from 'discord.js-commando';
import { LogUtil, PermsUtil } from '../../../util';
import Command from '../../command';
import ModmailBot from '../..';

type Args = {
  roleID: string;
  level: string;
}

/**
 * Add a Discord role to a Modmail category
 * Requirements:
 *  * Admin+
 *  * Must be used in a Discord guild being used as a Modmail category
 */
export default class AddRole extends Command {
  constructor(client: ModmailBot) {
    super(client, {
      name: 'addrole',
      aliases: ['grant'],
      description: 'Add a mod or admin role',
      guildOnly: true,
      group: 'perms',
      memberName: 'addrole',
      args: [
        {
          key: 'roleID',
          prompt: 'What\'s the role ID of the role to add',
          type: 'string',
        },
        {
          key: 'level',
          prompt: 'Are they an "admin" or "mod"?',
          type: 'string',
        },
      ],
    });
  }

  @PermsUtil.Requires('admin')
  public async run(msg: CommandoMessage, args: Args): Promise<Message | Message[] | null> {
    const [roleID, levelStr] = AddRole.fuzzy(args);
    const modmail = ModmailBot.getModmail();
    const category = await modmail.categories.getByGuild(msg.guild?.id || '');

    if (category === null || !category.isActive()) {
      const res = 'This guild doesn\'t have an active category.';
      LogUtil.cmdWarn(msg, res);
      await msg.say(res);
      return null;
    }

    if (levelStr !== 'mod' && levelStr !== 'admin') {
      const res = `"${levelStr}" isn't a valid level, try again.`;
      LogUtil.cmdWarn(msg, res);
      await msg.say(res);
      return null;
    }

    const isReal = await AddRole.isReal(msg.guild as Guild, roleID);
    if (!isReal) {
      await msg.say('That role doesn\'t exist.');
      return null;
    }

    const pool = ModmailBot.getDB();
    await pool.permissions.add({
      roleId: roleID,
      level: levelStr,
      categoryId: category.getID(),
    });

    await msg.say(`Role added as ${levelStr}`);
    return null;
  }

  private static async isReal(guild: Guild, roleID: string): Promise<boolean> {
    try {
      const role = await guild.roles.fetch(roleID);
      return role !== null;
    } catch (_) {
      return false;
    }
  }

  private static fuzzy(args: Args): [string, string] {
    if ((/[A-z]/g).test(args.roleID)) {
      // [roleID, level]
      return [args.level, args.roleID];
    }
    return [args.roleID, args.level];
  }
}
