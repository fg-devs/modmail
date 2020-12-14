import {
  GuildMember, MessageEmbed, MessageEmbedOptions, User,
} from 'discord.js';
import { IThreadManager } from '../models/interfaces';
import Members from './Members';
import { Category } from '../models/types';
import Categories from './Categories';

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
  public static newThreadFor(creator: GuildMember, target: GuildMember): MessageEmbed {
    const res = Embeds.newThread(creator);
    res.description = `${creator.user} created a new thread for ${target.user}.`;

    return res;
  }

  /**
   * When a new thread has spawned.
   * @param {GuildMember} creator The user that started the thread.
   * @returns {MessageEmbed}
   */
  public static newThread(creator: GuildMember): MessageEmbed {
    return Embeds.getGeneric({
      color: 0xB00B69,
      title: 'New Thread',
      description: `${creator.user} created a new thread.`,
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
        icon_url: member.user.avatarURL() || '',
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
    return Embeds.getGeneric({
      title: 'Category Selector',
      description: 'Please react with the corresponding emote for your desired category',
      fields: [
        {
          name: 'Available categories:',
          value: Categories.listCategories(categories),
        },
      ],
      color: 0xB00B69,
    });
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
        name: `${author.username}#${author.discriminator}`,
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
        name: `${author.username}#${author.discriminator}`,
        icon_url: author.avatarURL() || author.defaultAvatarURL,
      },
      description: content,
      color: 0xE8D90C,
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
