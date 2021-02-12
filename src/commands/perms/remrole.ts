import { Command, CommandoMessage } from 'discord.js-commando';
import { RoleLevel } from '@Floor-Gang/modmail-types';
import Modmail from '../../Modmail';
import LogUtil from '../../util/Logging';
import { Requires } from '../../util/Perms';

type Args = {
  roleID: string;
}

export default class RemoveRole extends Command {
  constructor(client: Modmail) {
    super(client, {
      name: 'remrole',
      aliases: ['revoke'],
      description: 'Remove a role',
      guildOnly: true,
      group: 'perms',
      memberName: 'remrole',
      args: [
        {
          key: 'roleID',
          prompt: 'The ID of the role to add',
          type: 'string',
        },
      ],
    });
  }

  @Requires(RoleLevel.Admin)
  public async run(msg: CommandoMessage, args: Args): Promise<null> {
    const { roleID } = args;
    const modmail = Modmail.getModmail();
    const category = await modmail.categories.getByMessage(msg, true);

    if (category === null) {
      const res = "This guild doesn't have an active category.";
      LogUtil.cmdWarn(msg, res);
      await msg.say(res);
      return null;
    }

    const pool = Modmail.getDB();
    const isRemoved = await pool.permissions.remove(roleID);

    if (isRemoved) {
      await msg.say('Removed role.');
    } else {
      await msg.say('Nothing was removed, are you sure the correct ID was provided?');
    }
    return null;
  }
}
