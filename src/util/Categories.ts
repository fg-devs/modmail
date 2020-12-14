import {
  CategoryChannel, DMChannel, Guild, TextChannel, User,
} from 'discord.js';
import { CommandoClient } from 'discord.js-commando';
import { Category } from '../models/types';
import DatabaseManager from '../database/database';
import Embeds from './Embeds';

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
   * @return {{category: CategoryChannel, guild: Guild} | undefined} returns undefined if the user
   * fails to react or does it wrong
   * */
  public static async categorySelector(
    pool: DatabaseManager,
    channel: TextChannel | DMChannel,
    user: User,
    client: CommandoClient,
  ): Promise<{category: CategoryChannel, guild: Guild, id: string} | undefined> {
    const categories = await pool.categories.getActiveCategories();
    const embed = Embeds.categorySelect(categories);
    const msg = await channel.send(embed);
    const emotes = categories.map((category) => category.emojiID);

    emotes.forEach((emote) => {
      msg.react(emote)
        .then((_) => _)
        .catch(console.warn);
    });

    const collection = await msg.awaitReactions(
      (reaction, reactionUser) => reactionUser.id === user.id,
      { max: 1, time: 30000 },
    );

    const emote = collection.first();
    if (emote === undefined) {
      await channel.send("You didn't answer in time, please restart the process by sending your message again.");
      return undefined;
    }

    if (!emotes.includes(emote.emoji.toString())) {
      await channel.send('What the heck, you should be using category emotes not new ones. >:(');
      return undefined;
    }

    const category = await pool.categories.getCategoryByEmote(emote.emoji.toString());
    if (category === undefined) {
      return undefined;
    }

    const categoryChannel = await client.channels.cache.get(category.channelID) as CategoryChannel;

    const categoryGuild = await client.guilds.cache.get(category.guildID) as Guild;

    return {
      category: categoryChannel,
      guild: categoryGuild,
      id: category.id,
    };
  }
}
