import { CommandoMessage } from 'discord.js-commando';
import { RoleLevel } from '@newcircuit/modmail-types';
import { Embeds, LogUtil, PermsUtil } from '../../../util';
import Command from '../../command';
import ModmailBot from '../..';

/**
 * List all the Discord roles of a Modmail category
 * Requirements:
 *  * Mod+
 *  * Must be used in a Discord guild being used as a Modmail category
 */
export default class ListRoles extends Command {
  constructor(client: ModmailBot) {
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

  @PermsUtil.Requires(RoleLevel.Mod)
  public async run(msg: CommandoMessage): Promise<null> {
    const modmail = ModmailBot.getModmail();
    const category = await modmail.categories.getByGuild(msg.guild?.id || '');

    if (!category || !category.isActive()) {
      const res = 'This guild doesn\'t have an active category.';
      LogUtil.cmdWarn(msg, res);
      await msg.say(res);
      return null;
    }

    const pool = ModmailBot.getDB();
    const roles = await pool.permissions.fetchAll(category.getID());
    const res = Embeds.listRoles(category, roles);

    await msg.say(res);
    return null;
  }
}
