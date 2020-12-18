import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import { Message } from 'discord.js';
import Modmail from '../../Modmail';
import Embeds from '../../util/Embeds';

export default class ReplyA extends Command {
  constructor(client: CommandoClient) {
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
    { content }: {content: string[]},
  ): Promise<Message | Message[] | null> {
    const pool = await Modmail.getDB();
    const thread = await pool.threads.getThreadByChannel(msg.channel.id);

    if (thread === null) {
      return msg.say('Not currently in a modmail thread');
    }

    const user = await this.client.users.fetch(thread.author.id, true, true);
    const dmChannel = user.dmChannel || await user.createDM();
    const text = content.join(' ');
    const threadEmbed = Embeds.messageSendAnon(text, msg.author);
    const dmEmbed = Embeds.messageReceivedAnon(text);
    const threadMessage = await msg.channel.send(threadEmbed);
    const dmMessage = await dmChannel.send(dmEmbed);

    await pool.users.create(msg.author.id);
    await pool.messages.add({
      clientID: dmMessage.id,
      content: text,
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
