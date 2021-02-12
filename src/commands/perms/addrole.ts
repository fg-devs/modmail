import { Guild, Message } from 'discord.js';
import { Command, CommandoMessage } from 'discord.js-commando';
import { RoleLevel } from '@Floor-Gang/modmail-types';
import Modmail from '../../Modmail';
import LogUtil from '../../util/Logging';
import * as PermUtil from '../../util/Perms';

type Args = {
  roleID: string;
  level: string;
}

export default class AddRole extends Command {
  constructor(client: Modmail) {
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
          prompt: 'The ID of the role to add',
          type: 'string',
        },
        {
          key: 'level',
          prompt: 'Mod or Admin',
          type: 'string',
        },
      ],
    });
  }

  @PermUtil.Requires(RoleLevel.Admin)
  public async run(msg: CommandoMessage, args: Args): Promise<Message | Message[] | null> {
    const { roleID } = args;
    const levelStr = args.level.toLowerCase();
    const modmail = Modmail.getModmail();
    const category = await modmail.categories.getByGuild(msg.guild?.id || '');
    const level = AddRole.getLevel(levelStr);

    if (category === null || !category.isActive()) {
      const res = 'This guild doesn\'t have an active category.';
      LogUtil.cmdWarn(msg, res);
      await msg.say(res);
      return null;
    }

    if (level === null) {
      const res = `"${args.level}" isn't a valid level, try again.`;
      LogUtil.cmdWarn(msg, res);
      await msg.say(res);
      return null;
    }

    const isReal = await AddRole.isReal(msg.guild as Guild, roleID);
    if (!isReal) {
      await msg.say('That role doesn\'t exist.');
      return null;
    }

    const pool = Modmail.getDB();
    await pool.permissions.add({
      roleID,
      level,
      category: category.getID(),
    });

    await msg.say(`Role added as ${levelStr}`);
    return null;
  }

  private static getLevel(level: string): RoleLevel | null {
    try {
      return PermUtil.resolveStr(level);
    } catch (_) {
      return null;
    }
  }

  private static async isReal(guild: Guild, roleID: string): Promise<boolean> {
    try {
      const role = await guild.roles.fetch(roleID);
      return role !== null;
    } catch (_) {
      return false;
    }
  }
}
