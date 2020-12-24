import { Message, TextChannel } from 'discord.js';
import { CommandoMessage } from 'discord.js-commando';
import Command from '../../models/command';
import Modmail from '../../Modmail';

type CatArgs = {
  name: string;
  emoji: string;
}

export default class AddCategory extends Command {
  constructor(client: Modmail) {
    super(client, {
      name: 'addcat',
      aliases: ['addcat', 'ac'],
      description: 'Add a category',
      ownerOnly: true,
      group: 'category',
      memberName: 'addcat',
      args: [
        {
          key: 'name',
          prompt: 'The category name',
          type: 'string',
        },
        {
          key: 'emoji',
          prompt: 'The category emoji',
          type: 'string',
        },
      ],
    });
  }

  public async run(msg: CommandoMessage, args: CatArgs): Promise<Message | Message[] | null> {
    const { name, emoji } = args;
    const pool = this.modmail.getDB();

    if (!(msg.channel instanceof TextChannel)) {
      return null;
    }

    const { parent } = msg.channel;
    if (!parent) {
      const res = "This channel isn't in a category.";
      this.logWarning(msg, res);
      return msg.say(res);
    }

    await pool.categories.create({
      guildID: msg.channel.guild.id,
      name,
      emote: emoji,
      channelID: parent.id,
    });

    return msg.say('Category added.');
  }
}
