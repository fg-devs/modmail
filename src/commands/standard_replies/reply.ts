import { CommandoMessage } from 'discord.js-commando';
import { Message } from 'discord.js';
import Modmail from '../../Modmail';
import Command from '../../models/command';
import Embeds from '../../util/Embeds';

type Args = {
  name: string
}

export default class StandardReply extends Command {
  constructor(client: Modmail) {
    super(client, {
      description: 'Reply with a standard reply',
      group: 'standard_replies',
      memberName: 'sr',
      name: 'sr',
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
    const pool = await this.client.getDB();
    const standardReply = await pool.standardReplies.get(args.name);
    if (standardReply === null) {
      const res = 'Unable to locate that standard reply...';
      this.logWarning(msg, res);
      return msg.say(res);
    }

    const thread = await pool.threads.getThreadByChannel(msg.channel.id);

    if (thread === null) {
      const res = 'Not currently in a modmail thread';
      this.logWarning(msg, res);
      return msg.say(res);
    }

    const user = await this.client.users.fetch(thread.author.id, true, true);
    const dmChannel = user.dmChannel || await user.createDM();
    const member = await msg.guild.members.fetch(msg.author.id);

    const footer = {
      text: member.roles.highest.name,
    };

    const threadEmbed = Embeds.messageSend(standardReply.reply, msg.author);
    const dmEmbed = Embeds.messageReceived(standardReply.reply, msg.author);

    threadEmbed.footer = footer;
    dmEmbed.footer = footer;

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
