import { RoleLevel } from '@Floor-Gang/modmail-types';
import { CommandoMessage } from 'discord.js-commando';
import Command from '../../models/command';
import Modmail from '../../Modmail';
import { Requires } from '../../util/Perms';

type Args = {
  name: string,
}

export default class StandardReplyDelete extends Command {
  constructor(client: Modmail) {
    super(client, {
      description: 'Delete a standard reply',
      aliases: ['srrm', 'srremove'],
      group: 'standard_replies',
      memberName: 'srdelete',
      guildOnly: true,
      name: 'srdelete',
      args: [
        {
          key: 'name',
          type: 'string',
          prompt: 'What\'s the name of the standard reply you want to remove?',
        },
      ],
    });
  }

  @Requires(RoleLevel.Mod)
  public async run(msg: CommandoMessage, args: Args): Promise<null> {
    const pool = Modmail.getDB();
    await pool.standardReplies.remove(args.name);
    await msg.react('✅');
    return null;
  }
}
