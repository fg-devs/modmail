import { RoleLevel } from '@NewCircuit/modmail-types';
import { CommandoMessage } from 'discord.js-commando';
import { Command } from '../../';
import ModmailBot from '../../../bot';
import { PermsUtil } from '../../../util/';

type Args = {
  name: string,
}

export default class StandardReplyDelete extends Command {
  constructor(client: ModmailBot) {
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

  @PermsUtil.Requires(RoleLevel.Mod)
  public async run(msg: CommandoMessage, args: Args): Promise<null> {
    const pool = ModmailBot.getDB();
    await pool.standardReplies.remove(args.name);
    await msg.react('✅');
    return null;
  }
}
