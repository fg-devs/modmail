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
    const modmail = Modmail.getModmail();
    const category = await modmail.categories.getByMessage(msg, false);

    if (category === null) {
      const res = "Couldn't find a category for this guild.";
      LogUtil.cmdWarn(msg, res);
      msg.say(res);
      return null;
    }

    await category.setActive(true);
    msg.say('Reactivated.');
    return null;
  }
}
