import {
  CategoryChannel, DMChannel, Guild, TextChannel, User,
} from 'discord.js';
import { CommandoClient } from 'discord.js-commando';
import { Category, CategoryResolvable } from '../models/types';
import Embeds from './Embeds';
import { ICategoryManger } from '../models/interfaces';
import { PROMPT_TIME } from '../globals';

export type CatSelector = {
  category: CategoryChannel,
  guild: Guild,
  id: string,
  name: string,
}

export default class Categories {
  /**
   * List roles of a member in a mention list fashion (see returns).
   * @param {Category[]} categories
   * @returns {string} "category = 👍"
   */
  public static listCategories(categories: Category[]): string {
    let res = '';
    for (let i = 0; i < categories.length; i += 1) {
      const category = categories[i];
      res += `${category.name} = ${category.emojiID}\n`;
    }

    return res;
  }

  /**
   * Start the categorySelector
   * @param {DatabaseManager} pool
   * @param {TextChannel | DMChannel} channel
   * @param {User} user
   * @param {CommandoClient} client
   * @return {Promise<CatSelector>}
   * @throws {Error} If user did the following:
   *  * Provided an invalid emoji
   *  * The user didn't answer.
   *  * The category selected couldn't be found (unlikey).
   *  * There are no active categories.
   */
  public static async categorySelector(
    pool: ICategoryManger,
    channel: TextChannel | DMChannel,
    user: User,
    client: CommandoClient,
  ): Promise<CatSelector> {
    const categories = await pool.fetchAll(CategoryResolvable.activity, 'true');

    if (categories.length === 0) {
      throw new Error('There are no active categories at the moment.');
    }

    const embed = Embeds.categorySelect(categories);
    const msg = await channel.send(embed);
    const emotes = categories.map((cat: Category) => cat.emojiID);

    emotes.forEach((emojiStr: string) => {
      msg.react(emojiStr)
        .then((_) => _)
        .catch(console.warn);
    });

    const collection = await msg.awaitReactions(
      (_, rUser: User) => rUser.id === user.id,
      { max: 1, time: PROMPT_TIME },
    );

    const emote = collection.first();

    // The user didn't answer in time
    if (emote === undefined) {
      throw new Error(
        "You didn't answer in time, please restart the process by sending "
        + 'your message again.',
      );
    }

    // The user provided an emoji that isn't even part of the prompt.
    if (!emotes.includes(emote.emoji.toString())) {
      throw new Error(
        'What the heck, you should be using category emotes not new ones. >:(',
      );
    }

    const category = await pool.fetch(
      CategoryResolvable.emote,
      emote.emoji.toString(),
    );
    const categoryChannel = await client.channels.fetch(
      category.channelID,
      true,
      true,
    ) as CategoryChannel;
    const categoryGuild = await client.guilds.fetch(
      category.guildID,
      true,
      true,
    );

    return {
      category: categoryChannel,
      guild: categoryGuild,
      id: category.id,
      name: category.name,
    };
  }
}
