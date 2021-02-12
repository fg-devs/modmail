import { Command, CommandoMessage } from 'discord.js-commando';
import { RoleLevel } from '@Floor-Gang/modmail-types';
import Modmail from '../../Modmail';
import * as PermsUtil from '../../util/Perms';
import { MessageAttachment } from 'discord.js';

export default class StandardReplyCreate extends Command {
  constructor(client: Modmail) {
    super(client, {
      description: 'list all standard replies',
      group: 'standard_replies',
      aliases: ['srls', 'srs', 'standardreplies'],
      memberName: 'srlist',
      guildOnly: true,
      name: 'srlist',
      args: [],
    });
  }

  @PermsUtil.Requires(RoleLevel.Mod)
  public async run(msg: CommandoMessage): Promise<null> {
    const pool = Modmail.getDB();
    const srs = await pool.standardReplies.fetchAll();
    let res = 'Standard Replies\n\n';

    for (let i = 0; i < srs.length; i += 1) {
      const sr = srs[i];
      res += `"${sr.name}:"\n${sr.reply}\n`;
    }

    const attachment = new MessageAttachment(
      Buffer.from(res),
      'standard_replies.txt',
    );

    await msg.reply('Here are all the standard replies', attachment);

    return null;
  }
}
