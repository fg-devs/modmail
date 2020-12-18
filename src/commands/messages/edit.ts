import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import { Message } from 'discord.js';
import Modmail from '../../Modmail';

export default class Edit extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'edit',
      aliases: ['e', 'change'],
      description: 'Edit a message',
      group: 'messages',
      memberName: 'edit',
      args: [
        {
          key: 'content',
          prompt: 'The content to add',
          type: 'string',
        },
      ],
    });
  }

  public async run(
    msg: CommandoMessage,
    { content }: {content: string},
  ): Promise<Message| Message[] | null> {
    const pool = await Modmail.getDB();
    const thread = await pool.threads.getThreadByChannel(msg.channel.id);
    if (thread === null) {
      return msg.say('Not currently in a thread..');
    }

    const user = await this.client.users.fetch(thread.author.id, true, true);
    const dmChannel = user.dmChannel || await user.createDM();
    let recentMessage;

    try {
      recentMessage = await pool.messages.getLastMessage(
        thread.id,
        msg.author.id,
      );
    } catch (_) {
      return msg.say('No recent messages in thread');
    }

    if (recentMessage.clientID === null) {
      return msg.say('Not a valid message');
    }

    const threadMessage = await msg.channel.messages.fetch(
      recentMessage.modmailID,
      true,
      true,
    );
    const clientMessage = await dmChannel.messages.fetch(
      recentMessage.clientID,
      true,
      true,
    );

    const threadEmbed = threadMessage.embeds[0];
    threadEmbed.description = content;

    const clientEmbed = clientMessage.embeds[0];
    clientEmbed.description = content;

    await threadMessage.edit(threadEmbed);
    await clientMessage.edit(clientEmbed);

    await pool.edits.add({
      content,
      message: threadMessage.id,
      version: 0,
    });

    await msg.react('✅');

    return null;
  }
}
