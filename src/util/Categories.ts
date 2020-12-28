import {
  CategoryChannel,
  DMChannel,
  Guild,
  TextChannel,
  User,
} from 'discord.js';
import { CommandoMessage } from 'discord.js-commando';
import { Category, CategoryResolvable } from '../models/types';
import Embeds from './Embeds';
import { PROMPT_TIME } from '../globals';
import Modmail from '../Modmail';
import { DiscordID } from '../models/identifiers';

export type CatSelector = {
  category: CategoryChannel,
  guild: Guild,
  id: string,
  name: string,
}

export default class Categories {
  private activeSelectors: Set<DiscordID> = new Set();

  private modmail: Modmail;

  constructor(modmail: Modmail) {
    this.modmail = modmail;
  }

  /**
   * Get category based on what guild the message is in
   * @param {CommandoMessage} msg
   * @param {boolean} isActive Whether or not the category must be active
   */
  public async getCategory(
    msg: CommandoMessage,
    isActive = true,
  ): Promise<Category | null> {
    if (!msg.guild) {
      return null;
    }

    const pool = this.modmail.getDB();
    const category = await pool.categories.fetch(
      CategoryResolvable.guild,
      msg.guild.id,
    );

    if (category === null || category.isActive !== isActive) {
      return null;
    }

    return category;
  }

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
  public async categorySelector(
    channel: TextChannel | DMChannel,
    user: User,
  ): Promise<CatSelector> {
    if (this.hasActiveSelector(user.id)) {
      throw new Error('Please select a category.');
    }
    const pool = this.modmail.getDB();
    const categories = await pool.categories.fetchAll(
      CategoryResolvable.activity,
      'true',
    );

    if (categories.length === 0) {
      throw new Error('There are no active categories at the moment.');
    }

    const embed = Embeds.categorySelect(categories);
    const msg = await channel.send(embed);
    this.remember(user.id);
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
    this.forget(user.id);

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

    const category = await pool.categories.fetch(
      CategoryResolvable.emote,
      emote.emoji.toString(),
    );

    if (category === null) {
      throw new Error("Couldn't get category based on emote.");
    }

    const categoryChannel = await this.modmail.channels.fetch(
      category.channelID,
      true,
      true,
    ) as CategoryChannel;
    const categoryGuild = await this.modmail.guilds.fetch(
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

  private hasActiveSelector(user: DiscordID): boolean {
    return this.activeSelectors.has(user);
  }

  private remember(user: DiscordID): void {
    this.activeSelectors.add(user);
  }

  private forget(user: DiscordID): void {
    this.activeSelectors.delete(user);
  }
}
