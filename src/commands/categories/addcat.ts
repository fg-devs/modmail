import { CategoryChannel, Message, TextChannel } from 'discord.js';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import Modmail from '../../Modmail';
import { CategoryConstraint as CatConst } from '../../util/Explain';

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
      // TODO(dylan): Add a proper permission system.
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
      await msg.say("This channel isn't in a category.");
      return null;
    }

    try {
      await pool.categories.create({
        guildID: msg.channel.guild.id,
        name,
        emote: emoji,
        channelID: parent.id,
      });

      return msg.say('Category added.');
    } catch (e) {
      console.error(`Failed adding "${name}" because\n`, e);
      return AddCategory.explain(msg, args, e);
    }
  }

  private static async explain(
    msg: CommandoMessage,
    args: CatArgs,
    err: Error,
  ): Promise<Message | Message[]> {
    const { emoji, name } = args;
    let res;
    if (err.message.includes('emote')) {
      res = CatConst.emote(emoji);
    } else if (err.message.includes('channel_id')) {
      res = CatConst.channelID(
        (msg.channel as TextChannel).parent as CategoryChannel,
      );
    } else if (err.message.includes('name')) {
      res = CatConst.catName(name);
    } else if (err.message.includes('categories_id')) {
      res = CatConst.id();
    } else {
      console.error(err);
      res = 'Something went wrong.';
    }

    return msg.say(res);
  }
}
