import { Message } from 'discord.js';
import { Command, CommandoMessage } from 'discord.js-commando';
import Modmail from '../../Modmail';
import Embeds from '../../util/Embeds';
import { CLOSE_THREAD_DELAY } from '../../globals';
import LogUtil from '../../util/Logging';

export default class CloseThread extends Command {
  constructor(client: Modmail) {
    super(client, {
      name: 'closethread',
      aliases: ['close', 'exit'],
      description: 'Close a thread',
      guildOnly: true,
      group: 'threads',
      memberName: 'close',
    });
  }

  public async run(msg: CommandoMessage): Promise<null> {
    const pool = Modmail.getDB();
    const thread = await pool.threads.getThreadByChannel(msg.channel.id);

    if (thread === null) {
      const res = 'Not currently in a thread';
      LogUtil.cmdWarn(msg, res);
      msg.say(res);
      return null;
    }

    const dmEmbed = Embeds.closeThreadClient();
    const threadEmbed = Embeds.closeThread();

    try {
      const user = await this.client.users.fetch(thread.author.id, true, true);
      const dmChannel = user.dmChannel || await user.createDM();
      await dmChannel.send(dmEmbed);
    } finally {
      await msg.channel.send(threadEmbed);
      await pool.threads.close(msg.channel.id);
      await new Promise((r) => setTimeout(r, CLOSE_THREAD_DELAY));
      await msg.channel.delete('Thread closed');
    }

    return null;
  }
}
