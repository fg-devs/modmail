import { Message } from 'discord.js';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import IssueHandler from '../../events/IssueHandler';
import { RoleLevel } from '../../models/types';
import Modmail from '../../Modmail';
import Categories from '../../util/Categories';
import { Requires } from '../../util/Perms';

export default class ActivateCategory extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'activate',
      aliases: [],
      description: 'Reactivate a category',
      group: 'category',
      memberName: 'activate',
      args: [],
    });
  }

  @Requires(RoleLevel.Admin)
  public async run(msg: CommandoMessage): Promise<Message | Message[] | null> {
    const pool = await Modmail.getDB();
    const category = await Categories.getCategory(msg, false);

    if (category === null) {
      const res = "Couldn't find a category for this guild.";
      IssueHandler.onCommandWarn(msg, res);
      return msg.say(res);
    }

    await pool.categories.setActive(category.id, true);
    return msg.say('Reactivated.');
  }
}
