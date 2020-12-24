import { Message } from 'discord.js';
import { CommandoMessage } from 'discord.js-commando';
import { RoleLevel } from '../../models/types';
import Modmail from '../../Modmail';
import Command from '../../models/command';
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
    const category = await this.catUtil.getCategory(msg, true);
    const level = AddRole.getLevel(levelStr);

    if (category === null) {
      const res = "This guild doesn't have an active category.";
      this.logWarning(msg, res);
      return msg.say(res);
    }

    if (level === null) {
      const res = `"${args.level}" isn't a valid level, try again.`;
      this.logWarning(msg, res);
      return msg.say(res);
    }
    const pool = this.client.getDB();

    await pool.permissions.add({
      roleID,
      level,
      category: category.id,
    });

    return msg.say(`Role added as ${levelStr}`);
  }

  private static getLevel(level: string): RoleLevel | null {
    try {
      return PermUtil.resolveStr(level);
    } catch (_) {
      return null;
    }
  }
}
