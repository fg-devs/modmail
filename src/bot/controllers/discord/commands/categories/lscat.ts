import { RoleLevel } from '@Floor-Gang/modmail-types';
import { CommandoMessage } from 'discord.js-commando';
import { Command, ModmailBot } from '../../';
import Embeds from '../../../../util/Embeds';
import { Requires } from '../../../../util/Perms';

export default class ListCategories extends Command {
  constructor(client: ModmailBot) {
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
    const modmail = ModmailBot.getModmail();
    const cats = await modmail.categories.getAll(false, true);
    const res = Embeds.listCategories(cats);

    await msg.say(res);
    return null;
  }
}
