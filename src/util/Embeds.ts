import {
  Attachment, Edit, FileType, Role, RoleLevel,
} from '@Floor-Gang/modmail-types';
import {
  GuildMember, MessageEmbed, MessageEmbedOptions, User,
} from 'discord.js';
import { CLOSE_THREAD_DELAY } from '../globals';
import Category from '../controllers/categories/category';
import Modmail from '../Modmail';

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
   * @param {User} user
   * @returns {Promise<MessageEmbed>}
   */
  public static async memberDetails(
    user: User,
  ): Promise<MessageEmbed> {
    const db = Modmail.getDB().threads;
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
  public static categorySelector(categories: Category[]): MessageEmbed {
    const res = Embeds.listCategories(categories);

    res.description = 'React to the category that you want to talk to.';

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
   * @param {GuildMember} sender
   * @param {boolean} anonymously
   * @returns {MessageEmbed}
   */
  public static messageSend(
    content: string,
    sender: User | GuildMember,
    anonymously: boolean,
  ): MessageEmbed {
    const embed = Embeds.getGeneric({
      description: content,
      color: 0x7CFC00,
    });
    const user = sender instanceof User
      ? sender
      : sender.user;

    if (sender instanceof GuildMember) {
      embed.footer = {
        text: anonymously
          ? 'Staff'
          : sender.roles.highest.name || 'Staff',
      };
    } else {
      embed.footer = { text: 'Staff' };
    }

    if (!anonymously) {
      embed.author = {
        name: user.tag,
        iconURL: user.avatarURL() || user.defaultAvatarURL,
      };
    } else {
      embed.author = {
        name: 'Staff Member',
      };
    }

    return embed;
  }

  /**
   * All embeds share the attributes returned here.
   * @param {string} content
   * @param {GuildMember | User} sender
   * @param {boolean} anonymously
   * @returns {MessageEmbed}
   */
  public static messageRecv(
    content: string,
    sender: GuildMember | User,
    anonymously = false,
  ): MessageEmbed {
    const embed = Embeds.messageSend(content, sender, anonymously);

    if (sender instanceof User) {
      embed.footer = {
        text: 'User',
      };
    }
    embed.color = 0xE8D90C;

    return embed;
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

  public static editsSend(user: User, edits: Edit[]): MessageEmbed {
    const last = edits[edits.length - 1];
    const embed = Embeds.messageSend(last.content, user, false);

    for (let i = 0; i < edits.length; i += 1) {
      const edit = edits[i];
      embed.addField(`Version ${edit.version}`, edit.content);
    }

    return embed;
  }

  public static editsRecv(user: User, edits: Edit[]): MessageEmbed {
    const last = edits[edits.length - 1];
    const embed = Embeds.messageRecv(last.content, user, false);

    for (let i = 0; i < edits.length; i += 1) {
      const edit = edits[i];
      embed.addField(`Version ${edit.version}`, edit.content);
    }

    return embed;
  }

  public static threadNotice(category: Category): MessageEmbed {
    return Embeds.getGeneric({
      title: 'New Thread',
      description: `You're being contacted by ${category.getName()}`,
      color: 0xADD8E6,
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
  public static forwardedBy(author: User): MessageEmbed {
    return Embeds.getGeneric({
      title: 'Conversation Forwarded',
      description: `This conversation was forwarded by ${author}`,
      author: {
        name: author.tag,
        icon_url: author.avatarURL() || author.defaultAvatarURL,
      },
    });
  }

  /**
   * All embeds share the attributes returned here.
   * @param {Attachment} attachment
   * @param {User} author
   * @param {boolean} anonymously
   * @returns {MessageEmbed}
   */
  public static attachmentSend(
    attachment: Attachment,
    author: GuildMember | User,
    anonymously = false,
  ): MessageEmbed {
    const embed = Embeds.messageSend(
      'Message Attachment',
      author,
      anonymously,
    );

    if (attachment.type === FileType.Image) {
      embed.image = {
        url: attachment.source,
      };
    } else {
      embed.description = `[${attachment.name}](${attachment.source})`;
    }

    return embed;
  }

  public static attachmentRecv(
    attachment: Attachment,
    author: GuildMember | User,
    anonymously = false,
  ): MessageEmbed {
    const embed = Embeds.attachmentSend(attachment, author, anonymously);

    embed.color = 0xE8D90C;

    return embed;
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
