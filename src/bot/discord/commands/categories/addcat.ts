import { TextChannel } from 'discord.js';
import { CommandoMessage } from 'discord.js-commando';
import { Command } from '../../';
import ModmailBot from '../../../bot';
import { LogUtil } from '../../../util';

type CatArgs = {
  name: string;
  emoji: string;
  isPrivate: string;
  description: string[];
}

export default class AddCategory extends Command {
  constructor(client: ModmailBot) {
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
          prompt: 'What\'s the category name?',
          type: 'string',
        },
        {
          key: 'emoji',
          prompt: 'What\'s the category emoji?',
          type: 'string',
        },
        {
          key: 'isPrivate',
          prompt: 'Is this category private (yes/no)?',
          type: 'string',
        },
        {
          key: 'description',
          prompt: 'What\'s the description of the category?',
          type: 'string',
          infinite: true,
        },
      ],
    });
  }

  public async run(msg: CommandoMessage, args: CatArgs): Promise<null> {
    const { name, emoji } = args;
    const isPrivate = args.isPrivate.toLowerCase().startsWith('y');
    const desc = args.description.length === 0
      ? ''
      : args.description.join(' ');
    const modmail = ModmailBot.getModmail();

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
      await modmail.categories.create(parent, emoji, name, isPrivate, desc);
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
