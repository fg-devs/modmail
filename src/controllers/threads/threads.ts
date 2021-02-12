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
import { PROMPT_TIME } from '../../globals';
import Category from '../categories/category';

export default class ThreadController extends Controller {
  constructor(modmail: Modmail) {
    super(modmail, 'threads');
  }

  /**
   * Create a new thread
   * @param {Message} msg Message sent by user in a DM
   */
  public async createFor(msg: Message): Promise<void> {
    const pool = Modmail.getDB();
    const dms = await msg.author.createDM();
    const category = await this.getCategory(dms);

    if (category === null) {
      return;
    }

    // check if the category is maxed out
    const isMaxed = await category.isMaxed();

    if (isMaxed) {
      await msg.reply(
        "This category has met it's max threads, try again later.",
      );
      return;
    }

    const isMuted = await category.isMuted(msg.author.id);

    // check if they're muted from the category selected
    if (isMuted) {
      await msg.reply("You're muted from this category.");
      return;
    }

    const isAdminOnly = await ThreadController.isAboutStaff(dms);
    const channel = await this.createChannel(
      msg.author,
      category,
      isAdminOnly,
    );

    if (channel === null) {
      return;
    }

    await pool.threads.open(
      msg.author.id,
      channel.id,
      category.getID(),
      isAdminOnly,
    );
    await msg.reply(
      'The thread is open, all messages now will be sent to the staff',
    );
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
      const channel = await this.setupChannel(user, category, isAdminOnly);

      // create user if they don't exit
      await pool.users.create(user.id);

      return channel;
    } catch (e) {
      logger.error(`Failed to create channel for ${user} in ${category}\n`, e);
    }
    return null;
  }

  private async setupChannel(
    user: User,
    category: Category,
    isAdminOnly: boolean,
  ): Promise<TextChannel | null> {
    const guild = await category.getGuild();
    const parent = await category.getCategory();

    if (parent === null) {
      throw new Error('The category channel for this category is gone.');
    }

    if (guild === null) {
      throw new Error('The guild for this category is gone.');
    }

    const userDetails = await Embeds.memberDetails(user);
    const threadDetails = Embeds.newThread(user);
    const channel = await guild.channels.create(
      `${user.username}-${user.discriminator}`,
      { type: 'text' },
    );

    try {
      await channel.setParent(parent);
      await channel.send(userDetails);
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

  private async getCategory(channel: DMChannel): Promise<Category | null> {
    const categories = await this.modmail.categories.getAll(true);
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
      { time: PROMPT_TIME, max: 1 },
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

  private static async isAboutStaff(channel: DMChannel): Promise<boolean> {
    await channel.send('Is this about a staff member (yes/no)?');
    const responses = await channel.awaitMessages(
      (msg: Message, u: User) => {
        const lower = msg.content.toLowerCase();
        return (lower.startsWith('y') || lower.startsWith('n'))
          && !u.bot;
      },
      { time: PROMPT_TIME, max: 1 },
    );
    const response = responses.first();

    if (response === undefined) {
      return false;
    }
    const lower = response.content.toLowerCase();
    return lower.startsWith('y');
  }

  private static async makeAdminOnly(
    category: Category,
    channel: TextChannel,
  ): Promise<void> {
    const roles = await category.getRoles();
    const perms: OverwriteResolvable[] = [
      {
        deny: ['VIEW_CHANNEL'],
        id: category.getGuildID(),
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
