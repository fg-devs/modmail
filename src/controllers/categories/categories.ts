import {
  Category as PartialCategory,
} from 'modmail-types';
import {
  CategoryChannel,
  DMChannel,
  Guild,
  TextChannel,
  User,
} from 'discord.js';
import { CommandoMessage } from 'discord.js-commando';
import { CategoryResolvable } from '../../models/types';
import Embeds from '../../util/Embeds';
import { PROMPT_TIME } from '../../globals';
import Modmail from '../../Modmail';
import Category from './category';

export type CatSelector = {
  category: CategoryChannel,
  guild: Guild,
  id: string,
  name: string,
}

export default class CatController {
  private activeSelectors: Set<string> = new Set();

  private readonly modmail: Modmail;

  constructor(modmail: Modmail) {
    this.modmail = modmail;
  }

  public async create(
    name: string,
    emoji: string,
    catChan: CategoryChannel,
  ): Promise<Category> {
    const pool = Modmail.getDB();

    const data = await pool.categories.create({
      guildID: catChan.guild.id,
      name,
      emote: emoji,
      channelID: catChan.id,
    });

    return new Category(this.modmail, data);
  }

  /**
   * Get category based on what guild the message is in
   * @param {CommandoMessage} msg
   * @param {boolean} isActive Whether or not the category must be active
   */
  public async getByMessage(
    msg: CommandoMessage,
    isActive = true,
  ): Promise<Category | null> {
    if (!msg.guild) {
      return null;
    }

    const pool = Modmail.getDB();
    const data = await pool.categories.fetch(
      CategoryResolvable.guild,
      msg.guild.id,
    );

    if (data === null || data.isActive !== isActive) {
      return null;
    }

    return new Category(this.modmail, data);
  }

  public async getByID(
    catID: string,
    isActive = true,
  ): Promise<Category | null> {
    const pool = Modmail.getDB();
    const data = await pool.categories.fetch(
      CategoryResolvable.id,
      catID,
    );

    if (data === null || data.isActive !== isActive) {
      return null;
    }

    return new Category(this.modmail, data);
  }

  public async getAll(isActive = true): Promise<Category[]> {
    const pool = Modmail.getDB();
    const cats = await pool.categories.fetchAll(
      CategoryResolvable.activity,
      isActive ? 'true' : 'false',
    );

    return cats.map(
      (data: PartialCategory) => new Category(this.modmail, data),
    );
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
      res += `${category.getName()} = ${category.getEmoji()}\n`;
    }

    return res;
  }

  /**
   * Start the categorySelector
   * @param {TextChannel | DMChannel} channel
   * @param {User} user
   * @return {Promise<CatSelector>}
   * @throws {Error} If user did the following:
   *  * Provided an invalid emoji
   *  * The user didn't answer.
   *  * The category selected couldn't be found (unlikely).
   *  * There are no active categories.
   */
  public async categorySelector(
    channel: TextChannel | DMChannel,
    user: User,
  ): Promise<CatSelector> {
    if (this.hasActiveSelector(user.id)) {
      throw new Error('Please select a category.');
    }

    const pool = Modmail.getDB();
    const categories = (await pool.categories.fetchAll(
      CategoryResolvable.activity,
      'true',
    )).map((data: PartialCategory) => new Category(this.modmail, data));

    if (categories.length === 0) {
      throw new Error('There are no active categories at the moment.');
    }

    const embed = Embeds.categorySelect(categories);
    const msg = await channel.send(embed);
    this.remember(user.id);
    const emotes = categories.map((cat: Category) => cat.getEmoji());

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

  private hasActiveSelector(user: string): boolean {
    return this.activeSelectors.has(user);
  }

  private remember(user: string): void {
    this.activeSelectors.add(user);
  }

  private forget(user: string): void {
    this.activeSelectors.delete(user);
  }
}
