import { RoleLevel } from 'modmail-types';
import { Command, CommandoMessage } from 'discord.js-commando';
import { CategoryResolvable } from '../../models/types';
import Modmail from '../../Modmail';
import Embeds from '../../util/Embeds';
import { Requires } from '../../util/Perms';

export default class ListCategories extends Command {
  constructor(client: Modmail) {
    super(client, {
      name: 'lscat',
      aliases: ['lscat', 'lc', 'ls'],
      description: 'List all categories',
      guildOnly: true,
      group: 'category',
      memberName: 'lscat',
      args: [],
    });
  }

  @Requires(RoleLevel.Mod)
  public async run(msg: CommandoMessage): Promise<null> {
    const pool = Modmail.getDB();
    const cats = await pool.categories.fetchAll(
      CategoryResolvable.activity,
      'true',
    );
    const res = Embeds.listCategories(cats);

    msg.say(res);
    return null;
  }
}
