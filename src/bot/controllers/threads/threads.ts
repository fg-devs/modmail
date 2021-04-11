import {
  DMChannel,
  Message,
  MessageReaction,
  OverwriteResolvable,
  TextChannel,
  User,
} from 'discord.js';
import { RoleLevel } from '@newcircuit/modmail-types';
import { Category, } from '../';
import { Embeds } from '../../util';
import { ADMIN_INDICATOR_PREFIX, PROMPT_TIME } from '../../../common/globals';
import Thread from './thread';
import Controller from '../controller';
import ModmailBot from '../../bot';

export default class ThreadController extends Controller {
  constructor(modmail: ModmailBot) {
    super(modmail, 'threads');
  }

  /**
   * Create a new thread for a member
   * @param {Message} msg The initial message they sent to the bot
   * @returns {Promise<Thread | null>}
   */
  public async createFor(msg: Message): Promise<Thread | null> {
    const pool = ModmailBot.getDB();
    const dms = await msg.author.createDM();
    const category = await this.getCategory(dms);

    if (category === null) {
      await msg.reply(
        'There aren\'t any categories at this time,'
        + ' or you didn\'t respond properly',
      );
      return null;
    }

    // check if the category is maxed out
    const isMaxed = await category.isMaxed();

    if (isMaxed) {
      await msg.reply(
        'This category has met it\'s max threads, try again later.',
      );
      return null;
    }

    const isMuted = await category.isMuted(msg.author.id);

    // check if they're muted from the category selected
    if (isMuted) {
      await msg.reply('You\'re muted from this category.');
      return null;
    }

    const isAdminOnly = await ThreadController.isAdminOnly(dms);
    // check if they already have an open thread
    const currentThread = await this.modmail.threads.getByAuthor(
      msg.author.id,
    );
    if (currentThread !== null) {
      await msg.reply('You already have a open thread.');
      return null;
    }

    const channel = await this.createChannel(
      msg.author,
      category,
      isAdminOnly,
    );

    if (channel === null) {
      return null;
    }

    const thread = await pool.threads.open(
      msg.author.id,
      channel.id,
      category.getID(),
      isAdminOnly,
    );
    await msg.reply(
      'The thread is open, all messages now will be sent to the '
      + (isAdminOnly ? 'admin' : 'staff'),
    );
    return new Thread(this.modmail, thread);
  }

  /**
   * Get the thread that a member created
   * @param {string}  userID ID of the member
   * @return {Promise<Thread | null>}
   */
  public async getByAuthor(userID: string): Promise<Thread | null> {
    const pool = ModmailBot.getDB();
    const data = await pool.threads.getByUser(userID);

    if (data !== null) {
      return new Thread(this.modmail, data);
    }

    return null;
  }

  /**
   * Get a thread that is associated with the text-based channel
   * @param {string} channelID
   * @returns {Promise<Thread | null>}
   */
  public async getByChannel(channelID: string): Promise<Thread | null> {
    const pool = ModmailBot.getDB();
    const data = await pool.threads.getByChannel(channelID);

    if (data !== null) {
      return new Thread(this.modmail, data);
    }

    return null;
  }

  /**
   * Get a thread based on a thread ID provided
   * @param {string} threadID
   * @returns {Promise<Thread | null>}
   */
  public async getByID(threadID: string): Promise<Thread | null> {
    const pool = ModmailBot.getDB();
    const data = await pool.threads.getByID(threadID);

    if (data !== null) {
      return new Thread(this.modmail, data);
    }

    return null;
  }

  /**
   * Create a new text-channel in the Discord server for a thread
   * @param {User} member The member of the thread 
   * @param {Category} category
   * @param {boolean} isAdminOnly
   * @returns {Promise<TextChannel | null>} Nullable if something went wrong
   */
  private async createChannel(
    member: User,
    category: Category,
    isAdminOnly: boolean,
  ): Promise<TextChannel | null> {
    const pool = ModmailBot.getDB();
    const logger = this.getLogger();

    // setup channel and send details about the member and the thread
    try {
      const channel = await ThreadController.setupChannel(
        member,
        category,
        isAdminOnly,
      );

      // create member if they don't exit
      await pool.users.create(member.id);

      return channel;
    } catch (e) {
      logger.error(
        `Failed to create channel for ${member} in ${category}\n`,
        e,
      );
    }
    return null;
  }

  /**
   * Setup a newly created text channel
   * @param {User} user The member who created the thread
   * @param {Category} category The category that the thread was created for
   * @param {boolean} isAdminOnly [description]
   * @param {User | null} creator The staff member that created the thread
   * @param {boolean} forwarded Whether or not the creator actually forwarded
   * the thread from another category
   * @return {Promise<TextChannel | null>} 
   */
  public static async setupChannel(
    user: User,
    category: Category,
    isAdminOnly: boolean,
    creator: User | null = null,
    forwarded = false,
  ): Promise<TextChannel | null> {
    const guild = await category.getGuild();
    const parent = await category.getCategory();
    const modmail = ModmailBot.getModmail();

    if (parent === null) {
      throw new Error('The category channel for this category is gone.');
    }

    if (guild === null) {
      throw new Error('The guild for this category is gone.');
    }

    let threadDetails = Embeds.threadDetails(
      isAdminOnly,
      user,
      creator,
      forwarded,
    );
    threadDetails = await Embeds.addHistory(
      threadDetails,
      category.getID(),
      user.id,
    );
    threadDetails = await Embeds.addRoles(
      threadDetails,
      modmail.guilds.cache.values(),
      user.id,
    );
    const channelName = `${isAdminOnly ? ADMIN_INDICATOR_PREFIX : ''}`
      + `${user.username}-${user.discriminator}`;
    const channel = await guild.channels.create(
      channelName,
      { type: 'text', parent },
    );

    try {
      const details = await channel.send(threadDetails);
      await channel.setTopic(`User ID: ${user.id}`);
      details.pin();

      if (isAdminOnly) {
        await ThreadController.makeAdminOnly(category, channel);
      }

      return channel;
    } catch (e) {
      await channel.delete();
      throw e;
    }
  }

  /**
   * Get a category based on a given Discord category channel
   * @param  {TextChannel | DMChannel} channel
   * @param  {boolean} privateCats
   * @return {Promise<Category | null>}
   */
  public async getCategory(
    channel: TextChannel | DMChannel,
    privateCats = false,
  ): Promise<Category | null> {
    const categories = await this.modmail.categories.getAll(
      true,
      privateCats,
    );

    if (categories.length === 1) {
      return categories[0];
    }
    if (categories.length === 0) {
      return null;
    }

    const selection = Embeds.categorySelector(categories);
    const msg = await channel.send(selection);
    const emojis: string[] = [];
    const tasks: Promise<MessageReaction>[] = [];

    for (let i = 0; i < categories.length; i += 1) {
      const emoji = categories[i].getEmoji();
      const task = msg.react(emoji);
      emojis.push(emoji);
      tasks.push(task);
    }
    await Promise.all(tasks);

    const reactions = await msg.awaitReactions(
      (r: MessageReaction, u: User) => (emojis.includes(r.emoji.name) && !u.bot),
      {
        time: PROMPT_TIME,
        max: 1,
      },
    );
    const reaction = reactions.first();

    if (reaction === undefined) {
      return null;
    }

    for (let i = 0; i < categories.length; i += 1) {
      const category = categories[i];

      if (category.getEmoji() === reaction.emoji.name) {
        return category;
      }
    }

    return null;
  }

  /**
   * Ask the creator if they want the thread to be admin only
   * @param {TextChannel | DMChannel} channel The channel to prompt
   * the creator in
   * @param {boolean} forwarded Whether or not the thread is being forwarded
   * @return {Promise<boolean>}
   */
  public static async isAdminOnly(
    channel: TextChannel | DMChannel,
    forwarded = false,
  ): Promise<boolean> {
    const msg = await channel.send(
      forwarded
      ? 'Should this be admin only?'
      : 'Is this about a staff member?'
    );
    
    await msg.react('👎');
    await msg.react('👍');
    
    const filter = (r: MessageReaction, u: User) => {
      return (r.emoji.name === '👍' || r.emoji.name === '👎') && !u.bot;
    }
    const reactions = await msg.awaitReactions(
      filter,
      {
        time: PROMPT_TIME,
        max: 1,
      },
    );
    const reaction = reactions.first();

    if (reaction === undefined) {
      return false;
    }

    return reaction.emoji.name === '👍';
  }

  private static async makeAdminOnly(
    category: Category,
    channel: TextChannel,
  ): Promise<void> {
    const client = ModmailBot.getModmail();
    const roles = await category.getRoles();
    const perms: OverwriteResolvable[] = [
      {
        deny: ['VIEW_CHANNEL'],
        id: category.getGuildID(),
      },
      {
        id: client.user ? client.user.id : '',
        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
      },
    ];

    for (let i = 0; i < roles.length; i += 1) {
      const role = roles[i];

      if (role.level === RoleLevel.Admin) {
        perms.push({
          allow: ['VIEW_CHANNEL'],
          id: role.roleID,
        });
      }
    }

    await channel.overwritePermissions(perms, 'Made thread admin only.');
  }
}
