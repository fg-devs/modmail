import { Command, CommandoMessage } from 'discord.js-commando';
import Modmail from '../../Modmail';

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

  public async run(msg: CommandoMessage): Promise<null> {
    const modmail = Modmail.getModmail();
    const thread = await modmail.threads.getByChannel(msg.channel.id);

    if (thread !== null) {
      await thread.sendMsg(msg, false);
    } else {
      await msg.reply('This is not an active thread.');
    }
    return null;
  }
}
