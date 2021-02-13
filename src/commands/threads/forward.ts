import { CommandoMessage } from 'discord.js-commando';
import { TextChannel } from 'discord.js';
import Command from '../../models/command';
import Modmail from '../../Modmail';

export default class Forward extends Command {
  constructor(client: Modmail) {
    super(client, {
      name: 'forward',
      description: 'Forward a thread to a new category',
      group: 'threads',
      memberName: 'forward',
      guildOnly: true,
    });
  }

  public async run(msg: CommandoMessage): Promise<null> {
    const modmail = Modmail.getModmail();
    const thread = await modmail.threads.getByChannel(msg.channel.id);

    if (thread === null) {
      await msg.reply('This isn\'t a thread.');
      return null;
    }

    const category = await modmail.threads.getCategory(
      msg.channel as TextChannel,
    );

    if (category === null) {
      await msg.reply('Couldn\'t get that category.');
      return null;
    }

    await thread.forward(msg.author, category);
    await msg.channel.delete();

    return null;
  }
}
