import { CommandoMessage } from 'discord.js-commando';
import { RoleLevel } from '@NewCircuit/modmail-types';
import { Command } from '../../';
import ModmailBot from '../../../bot';
import { Embeds, LogUtil, PermsUtil } from '../../../util/';

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
