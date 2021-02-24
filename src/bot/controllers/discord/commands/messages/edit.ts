import { CommandoMessage } from 'discord.js-commando';
import { Command, ModmailBot } from '../../';

type Args = {
  content: string;
}

export default class Edit extends Command {
  constructor(client: ModmailBot) {
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
          prompt: 'What\'s the new message?',
          type: 'string',
        },
      ],
    });
  }

  public async run(msg: CommandoMessage, { content }: Args): Promise<null> {
    const modmail = ModmailBot.getModmail();
    const thread = await modmail.threads.getByChannel(msg.channel.id);
    if (thread === null) {
      await msg.say('Not currently in a thread..');
      return null;
    }
    const thMsg = await thread.getLastMessage(msg.author.id);

    if (thMsg !== null) {
      await thMsg.edit(content);
      await msg.react('✅');
    } else {
      await msg.react('❌');
      await msg.reply("I couldn't find your last message.");
    }

    return null;
  }
}
