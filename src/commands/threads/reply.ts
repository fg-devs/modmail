import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import { Message } from 'discord.js';
import Embeds from '../../util/Embeds';
import Modmail from '../../Modmail';

export default class Reply extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'reply',
      aliases: ['r'],
      description: 'Reply to a user in modmail',
      group: 'threads',
      memberName: 'reply',
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
    { content }: {content: string[]},
  ): Promise<Message | Message[] | null> {
    const pool = await Modmail.getDB();
    const thread = await pool.threads.getThreadByChannel(msg.channel.id);

    if (thread === undefined) {
      return msg.say('Not currently in a modmail thread');
    }

    const user = await this.client.users.fetch(thread.author.id, true, true);
    const dmChannel = user.dmChannel || await user.createDM();
    const member = await msg.guild.members.fetch(msg.author.id);
    const footer = {
      text: member.roles.highest.name,
    };
    const text = content.join(' ');
    const threadEmbed = Embeds.messageSend(text, msg.author);
    const dmEmbed = Embeds.messageReceived(text, msg.author);

    threadEmbed.footer = footer;
    dmEmbed.footer = footer;

    const threadMessage = await msg.channel.send(threadEmbed);
    const dmMessage = await dmChannel.send(dmEmbed);

    await pool.messages.add({
      clientID: dmMessage.id,
      content: text,
      edits: [],
      files: [],
      isDeleted: false,
      modmailID: threadMessage.id,
      sender: msg.author.id,
      threadID: thread.id,
    });

    await msg.delete();
    return null;
  }
}
