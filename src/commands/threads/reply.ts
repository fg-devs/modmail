import { Message } from 'discord.js';
import { Command, CommandoMessage } from 'discord.js-commando';
import Embeds from '../../util/Embeds';
import Modmail from '../../Modmail';
import LogUtil from '../../util/Logging';

export default class Reply extends Command {
  constructor(client: Modmail) {
    super(client, {
      name: 'reply',
      aliases: ['r'],
      description: 'Reply to a user in modmail',
      group: 'threads',
      memberName: 'reply',
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

    const { client } = msg;
    const user = await client.users.fetch(thread.author.id);
    const dmChannel = user.dmChannel || await user.createDM();
    const member = await msg.guild.members.fetch(msg.author.id);
    const footer = {
      text: member.roles.highest.name,
    };
    const threadEmbed = Embeds.messageSend(content, msg.author);
    const dmEmbed = Embeds.messageReceived(content, msg.author);

    threadEmbed.footer = footer;
    dmEmbed.footer = footer;

    const threadMessage = await msg.channel.send(threadEmbed);
    const dmMessage = await dmChannel.send(dmEmbed);

    await pool.users.create(msg.author.id);
    await pool.messages.add({
      clientID: dmMessage.id,
      content,
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
