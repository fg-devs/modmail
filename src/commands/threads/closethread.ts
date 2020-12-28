import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import { Message } from 'discord.js';
import Modmail from '../../Modmail';
import Embeds from '../../util/Embeds';
import { CLOSE_THREAD_DELAY } from '../../globals';
import IssueHandler from '../../events/IssueHandler';

export default class CloseThread extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'closethread',
      aliases: ['close', 'exit'],
      description: 'Close a thread',
      guildOnly: true,
      group: 'threads',
      memberName: 'close',
    });
  }

  public async run(msg: CommandoMessage): Promise<Message | Message[] | null> {
    const pool = await Modmail.getDB();
    const thread = await pool.threads.getThreadByChannel(msg.channel.id);

    if (thread === null) {
      const res = 'Not currently in a thread';
      IssueHandler.onCommandWarn(msg, res);
      return msg.say(res);
    }

    const threadEmbed = Embeds.closeThread();
    const dmEmbed = Embeds.closeThreadClient();

    try {
      const user = await this.client.users.fetch(thread.author.id);
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
