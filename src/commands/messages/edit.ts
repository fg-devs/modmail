import { Command, CommandoMessage } from 'discord.js-commando';
import { Message } from 'discord.js';
import Modmail from '../../Modmail';

type Args = {
  content: string;
}

export default class Edit extends Command {
  constructor(client: Modmail) {
    super(client, {
      name: 'edit',
      aliases: ['e', 'change'],
      description: 'Edit a message',
      group: 'messages',
      memberName: 'edit',
      guildOnly: true,
      args: [
        {
          key: 'content',
          prompt: 'The content to add',
          type: 'string',
        },
      ],
    });
  }

  public async run(msg: CommandoMessage, { content }: Args): Promise<null> {
    const { client } = msg;
    const pool = Modmail.getDB();
    const thread = await pool.threads.getThreadByChannel(msg.channel.id);
    if (thread === null) {
      msg.say('Not currently in a thread..');
      return null;
    }

    const user = await client.users.fetch(thread.author.id);
    const dmChannel = user.dmChannel || await user.createDM();
    let recentMessage;

    try {
      recentMessage = await pool.messages.getLastMessage(
        thread.id,
        msg.author.id,
      );
    } catch (_) {
      msg.say('No recent messages in thread');
      return null;
    }

    if (recentMessage.clientID === null) {
      msg.say('Not a valid message');
      return null;
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
