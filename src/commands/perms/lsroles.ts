import { Message } from 'discord.js';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import IssueHandler from '../../events/IssueHandler';
import Modmail from '../../Modmail';
import Categories from '../../util/Categories';
import Embeds from '../../util/Embeds';

export default class ListRoles extends Command {
  constructor(client: CommandoClient) {
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
    const category = await Categories.getCategory(msg);

    if (!category) {
      const res = "This guild doesn't have a category.";
      IssueHandler.onCommandWarn(msg, res);
      return msg.say(res);
    }

    const pool = await Modmail.getDB();
    const roles = await pool.permissions.fetchAll(category.id);
    const res = Embeds.listRoles(category, roles);

    return msg.say(res);
  }
}
