import {
  GuildMember, MessageEmbed, MessageEmbedOptions, User,
} from 'discord.js';
import { IThreadManager } from '../models/interfaces';
import Members from './Members';
import { Category } from '../models/types';
import { CLOSE_THREAD_DELAY } from '../globals';

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
   * @param {GuildMember} member
   * @returns {Promise<MessageEmbed>}
   */
  public static async memberDetails(
    db: IThreadManager,
    member: GuildMember,
  ): Promise<MessageEmbed> {
    const numOfThreads = await db.countThreads(member.id);
    return Embeds.getGeneric({
      author: {
        name: member.user.tag,
        icon_url: member.user.avatarURL() || member.user.defaultAvatarURL,
      },
      description: `${member.user} has ${numOfThreads} past threads.`,
      color: 0x7289da,
      fields: [
        {
          name: 'Roles',
          value: Members.listRoles(member),
        },
      ],
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
      res.fields.push({
        name: `${cat.emojiID} - ${cat.name}`,
        value: `${cat.id}`,
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
        text: 'Anonymous',
      },
    });
  }

  /**
   * All embeds share the attributes returned here.
   * @param {string} content
   * @param {User} author
   * @returns {MessageEmbed}
   */
  public static messageReceivedAnon(content: string): MessageEmbed {
    return Embeds.getGeneric({
      author: {
        name: 'Moderator',
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
  public static memberLeft(member: GuildMember): MessageEmbed {
    return Embeds.getGeneric({
      title: 'User left the server',
      description: `${member} left the server`,
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
}
