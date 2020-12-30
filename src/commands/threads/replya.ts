import { Message } from 'discord.js';
import { Command, CommandoMessage } from 'discord.js-commando';
import Modmail from '../../Modmail';
import Embeds from '../../util/Embeds';
import LogUtil from '../../util/Logging';

export default class ReplyA extends Command {
  constructor(client: Modmail) {
    super(client, {
      name: 'anonymousreply',
      aliases: ['ar', 'anon'],
      description: 'Anonymously Reply to a user in modmail',
      group: 'threads',
      memberName: 'anonymous reply',
      guildOnly: true,
      args: [
        {
          key: 'content',
          prompt: 'The message you want to send',
          type: 'string',
          infinite: true,
        },
      ],
    });
  }

  public async run(
    msg: CommandoMessage,
  ): Promise<Message | Message[] | null> {
    const pool = Modmail.getDB();
    const thread = await pool.threads.getThreadByChannel(msg.channel.id);
    const content = msg.argString;

    if (thread === null) {
      const res = 'Not currently in a modmail thread';
      LogUtil.cmdWarn(msg, res);
      return msg.say(res);
    }

    const user = await this.client.users.fetch(thread.author.id, true, true);
    const dmChannel = user.dmChannel || await user.createDM();
    const threadEmbed = Embeds.messageSendAnon(content, msg.author);
    const dmEmbed = Embeds.messageReceivedAnon(content);
    const threadMessage = await msg.channel.send(threadEmbed);
    const dmMessage = await dmChannel.send(dmEmbed);

    await pool.users.create(msg.author.id);
    await pool.messages.add({
      content,
      clientID: dmMessage.id,
      edits: [],
      files: [],
      isDeleted: false,
      internal: false,
      modmailID: threadMessage.id,
      sender: msg.author.id,
      threadID: thread.id,
    });

    await msg.delete();
    return null;
  }
}
