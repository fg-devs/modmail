import { Message } from 'discord.js';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import { CategoryResolvable, RoleLevel } from '../../models/types';
import Modmail from '../../Modmail';
import Embeds from '../../util/Embeds';
import { Requires } from '../../util/Perms';

export default class ListCategories extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'lscat',
      aliases: ['lscat', 'lc', 'ls'],
      description: 'List all categories',
      group: 'category',
      memberName: 'lscat',
      args: [],
    });
  }

  @Requires(RoleLevel.Mod)
  public async run(msg: CommandoMessage): Promise<Message | Message[] | null> {
    const pool = await Modmail.getDB();
    const cats = await pool.categories.fetchAll(
      CategoryResolvable.activity,
      'true',
    );
    const res = Embeds.listCategories(cats);

    return msg.say(res);
  }
}
