import { TextChannel } from 'discord.js';
import { Command, CommandoMessage } from 'discord.js-commando';
import Modmail from '../../Modmail';
import LogUtil from '../../util/Logging';

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
      guildOnly: true,
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

  public async run(msg: CommandoMessage, args: CatArgs): Promise<null> {
    const { name, emoji } = args;
    const pool = Modmail.getDB();

    if (!(msg.channel instanceof TextChannel)) {
      return null;
    }

    const { parent } = msg.channel;
    if (!parent) {
      const res = "This channel isn't in a category.";
      LogUtil.cmdWarn(msg, res);
      msg.say(res);
      return null;
    }

    await pool.categories.create({
      guildID: msg.channel.guild.id,
      name,
      emote: emoji,
      channelID: parent.id,
    });

    msg.say('Category added.');
    return null;
  }
}
