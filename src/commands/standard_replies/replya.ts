import { Command, CommandoMessage } from 'discord.js-commando';
import { Message } from 'discord.js';
import Modmail from '../../Modmail';
import Embeds from '../../util/Embeds';
import LogUtil from '../../util/Logging';

type Args = {
  name: string
}

export default class StandardReplyAnon extends Command {
  constructor(client: Modmail) {
    super(client, {
      description: 'Reply with a standard reply anonymously',
      group: 'standard_replies',
      memberName: 'sreplya',
      name: 'sreplya',
      aliases: ['sra', 'sar'],
      guildOnly: true,
      args: [
        {
          key: 'name',
          type: 'string',
          prompt: 'The name of the standard reply',
        },
      ],
    });
  }

  public async run(msg: CommandoMessage, args: Args): Promise<Message | Message[] |null> {
    const pool = Modmail.getDB();
    const standardReply = await pool.standardReplies.get(args.name);
    if (standardReply === null) {
      const res = 'Unable to locate that standard reply...';
      LogUtil.cmdWarn(msg, res);
      return msg.say(res);
    }

    const thread = await pool.threads.getThreadByChannel(msg.channel.id);

    if (thread === null) {
      const res = 'Not currently in a modmail thread';
      LogUtil.cmdWarn(msg, res);
      return msg.say(res);
    }

    const user = await this.client.users.fetch(thread.author.id, true, true);
    const dmChannel = user.dmChannel || await user.createDM();
    const threadEmbed = Embeds.messageSendAnon(standardReply.reply, msg.author);
    const dmEmbed = Embeds.messageReceivedAnon(standardReply.reply);
    const threadMessage = await msg.channel.send(threadEmbed);
    const dmMessage = await dmChannel.send(dmEmbed);

    await pool.users.create(msg.author.id);
    await pool.messages.add({
      clientID: dmMessage.id,
      content: standardReply.reply,
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
