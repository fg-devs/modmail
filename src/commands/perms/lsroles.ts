import { Message } from 'discord.js';
import { CommandoMessage } from 'discord.js-commando';
import Modmail from '../../Modmail';
import Command from '../../models/command';
import Embeds from '../../util/Embeds';

export default class ListRoles extends Command {
  constructor(client: Modmail) {
    super(client, {
      name: 'listroles',
      aliases: ['lsroles'],
      description: 'List all roles for a category.',
      guildOnly: true,
      group: 'perms',
      memberName: 'listroles',
      args: [],
    });
  }

  public async run(msg: CommandoMessage): Promise<Message | Message[]> {
    const category = await this.catUtil.getCategory(msg);

    if (!category) {
      const res = "This guild doesn't have a category.";
      this.logWarning(msg, res);
      return msg.say(res);
    }

    const pool = this.client.getDB();
    const roles = await pool.permissions.fetchAll(category.id);
    const res = Embeds.listRoles(category, roles);

    return msg.say(res);
  }
}
