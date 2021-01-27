import { Command, CommandoMessage } from 'discord.js-commando';
import { RoleLevel } from 'modmail-types';
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
      guildOnly: true,
      memberName: 'activate',
      args: [],
    });
  }

  @Requires(RoleLevel.Admin)
  public async run(msg: CommandoMessage): Promise<null> {
    const pool = Modmail.getDB();
    const catUtil = Modmail.getCatUtil();
    const category = await catUtil.getCategory(msg, false);

    if (category === null) {
      const res = "Couldn't find a category for this guild.";
      LogUtil.cmdWarn(msg, res);
      msg.say(res);
      return null;
    }

    await pool.categories.setActive(category.id, true);
    msg.say('Reactivated.');
    return null;
  }
}
