import { Role, RoleLevel } from '@Floor-Gang/modmail-types';
import {
  GuildMember,
  MessageAttachment,
  MessageEmbed,
  MessageEmbedOptions,
  User,
} from 'discord.js';
import { ThreadsTable } from '@Floor-Gang/modmail-database';
import { CLOSE_THREAD_DELAY } from '../globals';
import Category from '../controllers/categories/category';

/**
 * @class Embeds
 * Embed builder utility class
 */
export default class Embeds {
  /**
   * This is used when a Modmail staff member (mod+) creates a new thread for
   * a user.
   * @param {GuildMember} creator Creator of the thread.
   * @param {GuildMember} target The user being mailed.
   * @returns {MessageEmbed}
   */
  public static newThreadFor(creator: User, target: User): MessageEmbed {
    const res = Embeds.newThread(creator);
    res.description = `${creator} created a new thread for ${target}.`;

    return res;
  }

  /**
   * When a new thread has spawned.
   * @param {GuildMember} creator The user that started the thread.
   * @returns {MessageEmbed}
   */
  public static newThread(creator: User): MessageEmbed {
    return Embeds.getGeneric({
      color: 0xB00B69,
      title: 'New Thread',
      description: `${creator} created a new thread.`,
    });
  }

  /**
   * Details about a member in a message embed. Usually used for a new thread.
   * @param {DatabaseManager} db To count how many past threads a user had.
   * @param {User} user
   * @returns {Promise<MessageEmbed>}
   */
  public static async memberDetails(
    db: ThreadsTable,
    user: User,
  ): Promise<MessageEmbed> {
    const numOfThreads = await db.countUser(user.id);
    const createdDays = this.getDays(user.createdAt);
    return Embeds.getGeneric({
      author: {
        name: user.tag,
        icon_url: user.avatarURL() || user.defaultAvatarURL,
      },
      description: `${user} was created ${createdDays} days ago, `
        + `with **${numOfThreads}** past threads`,
      color: 0x7289da,
      fields: [],
    });
  }

  /**
   * All embeds share the attributes returned here.
   * @param {Category[]} categories
   * @returns {MessageEmbed}
   */
  public static categorySelect(categories: Category[]): MessageEmbed {
    const res = Embeds.listCategories(categories);

    res.title = 'Select The Category You Want to Talk In';

    return res;
  }

  public static listCategories(categories: Category[]): MessageEmbed {
    const res = Embeds.getGeneric({
      title: 'Available Categories',
      fields: [],
      color: 0xB00B69,
    });

    for (let i = 0; i < categories.length; i += 1) {
      const cat = categories[i];
      const desc = cat.getDescription();
      res.fields.push({
        name: `${cat.getEmoji()} - ${cat.getName()}`,
        value: desc.length > 0 ? desc : '\u2800',
        inline: false,
      });
    }

    return res;
  }

  /**
   * All embeds share the attributes returned here.
   * @param {string} content
   * @param {User} author
   * @returns {MessageEmbed}
   */
  public static messageSend(content: string, author: User): MessageEmbed {
    return Embeds.getGeneric({
      author: {
        name: author.tag,
        icon_url: author.avatarURL() || author.defaultAvatarURL,
      },
      description: content,
      color: 0x7CFC00,
    });
  }

  /**
   * All embeds share the attributes returned here.
   * @param {string} content
   * @param {User} author
   * @returns {MessageEmbed}
   */
  public static messageReceived(content: string, author: User): MessageEmbed {
    return Embeds.getGeneric({
      author: {
        name: author.tag,
        icon_url: author.avatarURL() || author.defaultAvatarURL,
      },
      description: content,
      color: 0xE8D90C,
    });
  }

  /**
   * All embeds share the attributes returned here.
   * @param {string} content
   * @param {User} author
   * @returns {MessageEmbed}
   */
  public static messageSendAnon(content: string, author: User): MessageEmbed {
    return Embeds.getGeneric({
      author: {
        name: author.tag,
        icon_url: author.avatarURL() || author.defaultAvatarURL,
      },
      description: content,
      color: 0x7CFC00,
      footer: {
        text: 'Staff',
      },
    });
  }

  /**
   * All embeds share the attributes returned here.
   * @param {string} content
   * @returns {MessageEmbed}
   */
  public static messageReceivedAnon(content: string): MessageEmbed {
    return Embeds.getGeneric({
      author: {
        name: 'Staff',
      },
      description: content,
      color: 0xE8D90C,
    });
  }

  /**
   * All embeds share the attributes returned here.
   * @returns {MessageEmbed}
   */
  public static closeThread(): MessageEmbed {
    return Embeds.getGeneric({
      title: 'Conversation closed',
      description: 'This channel will get deleted in'
      + ` ${CLOSE_THREAD_DELAY / 1000} seconds...`,
    });
  }

  /**
   * All embeds share the attributes returned here.
   * @returns {MessageEmbed}
   */
  public static closeThreadClient(): MessageEmbed {
    return Embeds.getGeneric({
      title: 'Thread closed',
      description: 'This thread has been closed.',
      footer: {
        text: 'Sending another message will open a new thread.',
      },
    });
  }

  /**
   * All embeds share the attributes returned here.
   * @returns {MessageEmbed}
   */
  public static memberJoined(member: GuildMember): MessageEmbed {
    return Embeds.getGeneric({
      title: 'User joined the server',
      description: `${member} joined the server`,
      author: {
        icon_url: member.user.avatarURL() || member.user.defaultAvatarURL,
        name: member.user.tag,
      },
    });
  }

  /**
   * All embeds share the attributes returned here.
   * @returns {MessageEmbed}
   */
  public static memberLeft(user: User): MessageEmbed {
    return Embeds.getGeneric({
      title: 'User left the server',
      description: `${user} left the server`,
      author: {
        icon_url: user.avatarURL() || user.defaultAvatarURL,
        name: user.tag,
      },
    });
  }

  /**
   * All embeds share the attributes returned here.
   * @returns {MessageEmbed}
   */
  public static internalMessage(content: string, author: User): MessageEmbed {
    return Embeds.getGeneric({
      author: {
        name: author.tag,
        icon_url: author.avatarURL() || author.defaultAvatarURL,
      },
      description: content,
      color: 0xADD8E6,
      footer: {
        text: 'Internal message',
      },
    });
  }

  /**
   * All embeds share the attributes returned here.
   * @returns {MessageEmbed}
   */
  public static successfulForward(): MessageEmbed {
    return Embeds.getGeneric({
      title: 'Conversation Forwarded',
      description: 'Successfully forwarded the thread, this channel will get deleted in '
        + `${CLOSE_THREAD_DELAY / 1000} seconds...`,
    });
  }

  /**
   * All embeds share the attributes returned here.
   * @returns {MessageEmbed}
   */
  public static forwardedBy(author: User, category: string): MessageEmbed {
    return Embeds.getGeneric({
      title: 'Conversation Forwarded',
      description: `This conversation was forwarded by ${author} from ${category}`,
      author: {
        name: author.tag,
        icon_url: author.avatarURL() || author.defaultAvatarURL,
      },
    });
  }

  /**
   * All embeds share the attributes returned here.
   * @param {MessageAttachment} attachment
   * @param {User} author
   * @returns {MessageEmbed}
   */
  public static messageAttachmentImage(
    attachment: MessageAttachment,
    author: User,
  ): MessageEmbed {
    return Embeds.getGeneric({
      title: 'Message Attachment',
      image: {
        url: attachment.url,
        proxy_url: attachment.proxyURL,
      },
      author: {
        name: author.tag,
        icon_url: author.avatarURL() || author.defaultAvatarURL,
      },
      color: 0xE8D90C,
    });
  }

  /**
   * All embeds share the attributes returned here.
   * @param {MessageAttachment} attachment
   * @param {User} author
   * @returns {MessageEmbed}
   */
  public static messageAttachment(
    attachment: MessageAttachment,
    author: User,
  ): MessageEmbed {
    return Embeds.getGeneric({
      title: 'Message Attachment',
      description: `[${attachment.name}](${attachment.url})`,
      author: {
        name: author.tag,
        icon_url: author.avatarURL() || author.defaultAvatarURL,
      },
      color: 0xE8D90C,
    });
  }

  /**
   * Build an embed that lists all the roles of a category
   * @param {Category} cat
   * @param {Role[]} roles
   * @returns {MessageEmbed}
   */
  public static listRoles(cat: Category, roles: Role[]): MessageEmbed {
    const res = Embeds.getGeneric({
      title: `Roles of ${cat.getName()} - ${cat.getEmoji()}`,
      description: '',
      color: 'BLURPLE',
    });

    for (let i = 0; i < roles.length; i += 1) {
      const role = roles[i];
      const level = role.level === RoleLevel.Admin
        ? '**[admin]**'
        : '**[mod]**';

      res.description += `${level} <@&${role.roleID}> (\`${role.roleID}\`)\n`;
    }

    return res;
  }

  /**
   * Embed for a mute status if someone is muted.
   * @param {string} catName Category name
   * @param {Date} till Muted until unix timestamp (ms)
   */
  public static muted(catName: string, till: number): MessageEmbed {
    return Embeds.getGeneric({
      title: `You're muted from ${catName}`,
      color: 'RED',
      timestamp: Math.floor(till),
      footer: {
        text: 'Until',
      },
    });
  }

  /**
   * All embeds share the attributes returned here.
   * @param {MessageEmbedOptions} data Additional or overwriting attributes
   * options.
   * @returns {MessageEmbed}
   */
  private static getGeneric(data: MessageEmbedOptions): MessageEmbed {
    return new MessageEmbed({
      timestamp: new Date(),
      ...data,
    });
  }

  private static getDays(timestamp: Date | null): number {
    if (timestamp === null) {
      return 0;
    }
    return Math.ceil(
      (Math.abs(Date.now() - timestamp.getTime()) / (1000 * 60 * 60 * 24)),
    );
  }
}
