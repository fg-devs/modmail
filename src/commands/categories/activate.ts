import { TextChannel, Message } from 'discord.js';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import { CategoryResolvable } from '../../models/types';
import Modmail from '../../Modmail';

export default class ActivateCategory extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'activate',
      aliases: [],
      description: 'Reactivate a category',
      // TODO(dylan): Add a proper permission system.
      ownerOnly: true,
      group: 'category',
      memberName: 'activate',
      args: [],
    });
  }

  public async run(msg: CommandoMessage): Promise<Message | Message[] | null> {
    const { parent } = msg.channel as TextChannel;

    if (!parent) {
      return msg.say("This channel isn't part of a category.");
    }
    const pool = await Modmail.getDB();

    try {
      const category = await pool.categories.fetch(
        CategoryResolvable.channel,
        parent.id,
      );
      await pool.categories.setActive(category.id, true);
      return msg.say('Reactivated.');
    } catch (e) {
      return msg.say(e.message);
    }
  }
}
