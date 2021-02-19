import {
  DMChannel,
  Message,
  MessageReaction,
  OverwriteResolvable,
  TextChannel,
  User,
} from 'discord.js';
import { RoleLevel } from '@Floor-Gang/modmail-types';
import Thread from './thread';
import Controller from '../../models/controller';
import Modmail from '../../Modmail';
import Embeds from '../../util/Embeds';
import { ADMIN_INDICATOR_PREFIX, PROMPT_TIME } from '../../globals';
import Category from '../categories/category';

export default class ThreadController extends Controller {
  constructor(modmail: Modmail) {
    super(modmail, 'threads');
  }

  /**
   * Create a new thread
   * @param {Message} msg Message sent by user in a DM
   */
  public async createFor(msg: Message): Promise<Thread | null> {
    const pool = Modmail.getDB();
    const dms = await msg.author.createDM();
    const category = await this.getCategory(dms);

    if (category === null) {
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

    const isAdminOnly = await ThreadController.isAboutStaff(dms);
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
      `The thread is open, all messages now will be sent to the ${isAdminOnly ? 'admin' : 'staff'}`,
    );
    return new Thread(this.modmail, thread);
  }

  public async getByAuthor(userID: string): Promise<Thread | null> {
    const pool = Modmail.getDB();
    const data = await pool.threads.getByUser(userID);

    if (data !== null) {
      return new Thread(this.modmail, data);
    }

    return null;
  }

  public async getByChannel(channelID: string): Promise<Thread | null> {
    const pool = Modmail.getDB();
    const data = await pool.threads.getByChannel(channelID);

    if (data !== null) {
      return new Thread(this.modmail, data);
    }

    return null;
  }

  public async getByID(id: string): Promise<Thread | null> {
    const pool = Modmail.getDB();
    const data = await pool.threads.getByID(id);

    if (data !== null) {
      return new Thread(this.modmail, data);
    }

    return null;
  }

  /**
   * Create thread channel
   * @param {User} user creating the thread channel for
   * @param {Category} category
   * @param {boolean} isAdminOnly
   * @returns {Promise<TextChannel | null>} Nullable if something went wrong
   */
  private async createChannel(
    user: User,
    category: Category,
    isAdminOnly: boolean,
  ): Promise<TextChannel | null> {
    const pool = Modmail.getDB();
    const logger = this.getLogger();

    // setup channel and send details about the user and the thread
    try {
      const channel = await ThreadController.setupChannel(user, category, isAdminOnly);

      // create user if they don't exit
      await pool.users.create(user.id);

      return channel;
    } catch (e) {
      logger.error(`Failed to create channel for ${user} in ${category}\n`, e);
    }
    return null;
  }

  public static async setupChannel(
    user: User,
    category: Category,
    isAdminOnly: boolean,
    creator: User | null = null,
    forwarded = false,
  ): Promise<TextChannel | null> {
    const guild = await category.getGuild();
    const parent = await category.getCategory();
    const modmail = Modmail.getModmail();

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
    threadDetails = Embeds.addHistory(
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
      { type: 'text' },
    );

    try {
      await channel.setParent(parent);
      await channel.send(threadDetails);
      await channel.setTopic(`User ID: ${user.id}`);

      if (isAdminOnly) {
        await ThreadController.makeAdminOnly(category, channel);
      }

      return channel;
    } catch (e) {
      await channel.delete();
      throw e;
    }
  }

  public async getCategory(
    channel: TextChannel | DMChannel,
    privateCats = false,
  ): Promise<Category | null> {
    const categories = await this.modmail.categories.getAll(true, privateCats);
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

  public static async isAboutStaff(
    channel: TextChannel | DMChannel,
  ): Promise<boolean> {
    const msg = await channel.send('Is this about a staff member?');
    await msg.react('👍');
    await msg.react('👎');
    const reactions = await msg.awaitReactions(
      (r: MessageReaction, u: User) => (r.emoji.name === '👍' || r.emoji.name === '👎') && !u.bot,
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
    const client = Modmail.getModmail();
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
