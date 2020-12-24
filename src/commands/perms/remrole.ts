import { Message } from 'discord.js';
import { CommandoMessage } from 'discord.js-commando';
import { RoleLevel } from '../../models/types';
import Modmail from '../../Modmail';
import Command from '../../models/command';
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
  public async run(msg: CommandoMessage, args: Args): Promise<Message | Message[]> {
    const { roleID } = args;
    const category = await this.catUtil.getCategory(msg, true);

    if (category === null) {
      const res = "This guild doesn't have an active category.";
      this.logWarning(msg, res);
      return msg.say(res);
    }

    const pool = this.modmail.getDB();
    const isRemoved = await pool.permissions.remove(roleID);

    if (isRemoved) {
      return msg.say('Removed role.');
    }
    return msg.say('Nothing was removed, are you sure the correct ID was provided?');
  }
}
