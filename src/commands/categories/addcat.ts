import { TextChannel } from 'discord.js';
import { CommandoMessage } from 'discord.js-commando';
import Command from '../../models/command';
import Modmail from '../../Modmail';
import LogUtil from '../../util/Logging';

type CatArgs = {
  name: string;
  emoji: string;
  description: string[];
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
        {
          key: 'description',
          prompt: 'The category description',
          type: 'string',
          infinite: true,
        },
      ],
    });
  }

  public async run(msg: CommandoMessage, args: CatArgs): Promise<null> {
    const { name, emoji } = args;
    const desc = args.description.length === 0
      ? ''
      : args.description.join(' ');
    const modmail = Modmail.getModmail();

    if (!(msg.channel instanceof TextChannel)) {
      return null;
    }

    const { parent } = msg.channel;
    if (!parent) {
      const res = "This channel isn't in a category.";
      LogUtil.cmdWarn(msg, res);
      await msg.say(res);
      return null;
    }

    try {
      await modmail.categories.create(parent, emoji, name, desc);
      await msg.say('Category added.');
    } catch (e) {
      let res;
      if (e.message.includes('channel_id') || e.message.includes('guild_id')) {
        res = 'This guild already has a category';
      } else if (e.message.includes('emoji')) {
        res = 'This emoji is already being used.';
      } else {
        res = 'Something internal went wrong.';
      }
      LogUtil.cmdError(msg, e, res);
      await msg.say(res);
    }

    return null;
  }
}
