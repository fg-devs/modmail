import { RoleLevel } from '@newcircuit/modmail-types';
import { CommandoMessage } from 'discord.js-commando';
import { Command } from '../../';
import { Embeds, PermsUtil } from '../../../util';
import ModmailBot from '../../../bot';

/**
 * List all the categories
 * Requirements:
 *  * Mod+
 */
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

  @PermsUtil.Requires(RoleLevel.Mod)
  public async run(msg: CommandoMessage): Promise<null> {
    const modmail = ModmailBot.getModmail();
    const cats = await modmail.categories.getAll(false, true);
    const res = Embeds.listCategories(cats);

    await msg.say(res);
    return null;
  }
}
