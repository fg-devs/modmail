import { Command, CommandoMessage } from 'discord.js-commando';
import { Message } from 'discord.js';
import { RoleLevel } from '../../models/types';
import Modmail from '../../Modmail';
import { Requires } from '../../util/Perms';
import LogUtil from '../../util/Logging';

export default class ActivateCategory extends Command {
  constructor(client: Modmail) {
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
    const pool = Modmail.getDB();
    const catUtil = Modmail.getCatUtil();
    const category = await catUtil.getCategory(msg, false);

    if (category === null) {
      const res = "Couldn't find a category for this guild.";
      LogUtil.cmdWarn(msg, res);
      return msg.say(res);
    }

    await pool.categories.setActive(category.id, true);
    return msg.say('Reactivated.');
  }
}
