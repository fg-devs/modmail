import { RoleLevel } from '@Floor-Gang/modmail-types';
import { Command, CommandoMessage } from 'discord.js-commando';
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
    const modmail = Modmail.getModmail();
    const cats = await modmail.categories.getAll(false);
    const res = Embeds.listCategories(cats);

    await msg.say(res);
    return null;
  }
}
