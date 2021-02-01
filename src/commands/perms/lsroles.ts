import { Command, CommandoMessage } from 'discord.js-commando';
import { RoleLevel } from 'modmail-types';
import Modmail from '../../Modmail';
import Embeds from '../../util/Embeds';
import LogUtil from '../../util/Logging';
import * as PermUtil from '../../util/Perms';

export default class ListRoles extends Command {
  constructor(client: Modmail) {
    super(client, {
      name: 'listroles',
      aliases: ['lsroles', 'roles', 'rolelist'],
      description: 'List all roles for a category.',
      guildOnly: true,
      group: 'perms',
      memberName: 'listroles',
      args: [],
    });
  }

  @PermUtil.Requires(RoleLevel.Mod)
  public async run(msg: CommandoMessage): Promise<null> {
    const catUtil = Modmail.getCatUtil();
    const category = await catUtil.getCategory(msg);

    if (!category) {
      const res = "This guild doesn't have a category.";
      LogUtil.cmdWarn(msg, res);
      msg.say(res);
      return null;
    }

    const pool = Modmail.getDB();
    const roles = await pool.permissions.fetchAll(category.id);
    const res = Embeds.listRoles(category, roles);

    msg.say(res);
    return null;
  }
}
