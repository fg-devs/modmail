import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import { Message } from 'discord.js';
import Modmail from '../../Modmail';
import { Requires } from '../../util/Perms';
import { RoleLevel } from '../../models/types';

type Args = {
  name: string,
}

export default class StandardReplyDelete extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      description: 'Delete a standard reply',
      aliases: ['srrm', 'srremove'],
      group: 'standard_replies',
      memberName: 'srdelete',
      name: 'srdelete',
      args: [
        {
          key: 'name',
          type: 'string',
          prompt: 'The name of the standard reply',
        },
      ],
    });
  }

  @Requires(RoleLevel.Mod)
  public async run(msg: CommandoMessage, args: Args): Promise<Message | Message[] | null> {
    const pool = await Modmail.getDB();
    await pool.standardReplies.remove(args.name);
    await msg.react('✅');
    return null;
  }
}
