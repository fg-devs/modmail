import { Message, TextChannel } from 'discord.js';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import IssueHandler from '../../events/IssueHandler';
import Modmail from '../../Modmail';

type CatArgs = {
  name: string;
  emoji: string;
}

export default class AddCategory extends Command {
  constructor(client: CommandoClient) {
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
    const pool = await Modmail.getDB();

    if (!(msg.channel instanceof TextChannel)) {
      return null;
    }

    const { parent } = msg.channel;
    if (!parent) {
      const res = "This channel isn't in a category.";
      IssueHandler.onCommandWarn(msg, res);
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
