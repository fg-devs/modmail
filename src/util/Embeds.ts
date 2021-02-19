import {
  Attachment,
  Edit,
  FileType,
  Role,
  RoleLevel,
} from '@Floor-Gang/modmail-types';
import {
  GuildMember,
  MessageEmbed,
  MessageEmbedOptions,
  User,
  Role as DRole, Guild, EmbedField,
} from 'discord.js';
import { CLOSE_THREAD_DELAY, COLORS, CONFIG } from '../globals';
import Category from '../controllers/categories/category';
import Modmail from '../Modmail';

/**
 * @class Embeds
 * Embed builder utility class
 */
export default class Embeds {
  /**
   * Details about a member in a message embed. Usually used for a new thread.
   * @param {boolean} isAdminOnly
   * @param {User} user
   * @param {User | null} creator
   * @param {boolean?} forwarded
   * @returns {Promise<MessageEmbed>}
   */
  public static threadDetails(
    isAdminOnly: boolean,
    user: User,
    creator: User | null = null,
    forwarded = false,
  ): MessageEmbed {
    const embed = Embeds.getGeneric({
      author: {
        name: user.tag,
        icon_url: user.avatarURL() || user.defaultAvatarURL,
      },
      color: COLORS.INTERNAL,
      fields: [],
    });

    if (creator !== null) {
      embed.description = creator.toString();
      embed.description += forwarded ? ' forwarded' : ' created';
      embed.description += isAdminOnly ? ' an admin only' : ' a new';
      embed.description += ` thread for ${user}.`;
    } else {
      embed.description = `${user} created ${isAdminOnly ? 'an admin only' : 'a new'} thread.`;
    }

    return embed;
  }

  public static async addHistory(
    embed: MessageEmbed,
    catID: string,
    userID: string,
  ): Promise<MessageEmbed> {
    const modmail = Modmail.getDB();
    const newEmbed = embed;
    const thCount = await modmail.threads.countUser(userID);
    newEmbed.description += '\n\n'
      + '[Click here]'
      + `(https://${CONFIG.domain}/category/${catID}/users/${userID}/history)`;
    newEmbed.description += thCount > 0
      ? `to see this user's ${thCount} past threads`
      : 'to see past threads, this user doesn\'t have any yet.';
    return newEmbed;
  }

  public static async addRoles(
    embed: MessageEmbed,
    guilds: Iterator<Guild>,
    userID: string,
  ): Promise<MessageEmbed> {
    const memberTasks: Promise<GuildMember | null>[] = [];
    const newEmbed = embed;
    let guildOpt = guilds.next();

    while (!guildOpt.done) {
      const guild = guildOpt.value;
      const memberTask = guild.members.fetch(userID).catch(() => null);
      memberTasks.push(memberTask);

      guildOpt = guilds.next();
    }

    const members = await Promise.all(memberTasks);

    for (let i = 0; i < members.length; i += 1) {
      const member = members[i];
      if (member === null) {
        continue;
      }

      const field: EmbedField = {
        name: member.guild.name,
        value: '',
        inline: true,
      };

      const roles = member.roles.cache.sort((rA, rB) => {
        if (rA.position > rB.position) {
          return -1;
        }
        if (rA.position === rB.position) {
          return 0;
        }
        return 1;
      }).values();
      let roleOpt = roles.next();

      while (!roleOpt.done) {
        const role = roleOpt.value;
        if (role.id !== role.guild.id) {
          field.value += `• ${role.name}\n`;
        }
        roleOpt = roles.next();
      }

      if (field.value.length > 0) {
        newEmbed.fields.push(field);
      }
    }

    return newEmbed;
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
      color: COLORS.INTERNAL,
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
      color: COLORS.SEND,
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
    embed.color = COLORS.RECEIVE;

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
      color: COLORS.INTERNAL,
      author: {
        icon_url: member.user.avatarURL() || member.user.defaultAvatarURL,
        name: member.user.tag,
      },
    });
  }

  public static memberRoleAdd(member: GuildMember, role: DRole): MessageEmbed {
    return Embeds.getGeneric({
      title: `${member.guild.name}`,
      description: `${member} got the "${role.name}" role.`,
      color: COLORS.INTERNAL,
      author: {
        icon_url: member.user.avatarURL() || member.user.defaultAvatarURL,
        name: member.user.tag,
      },
    });
  }

  public static warning(context: string): MessageEmbed {
    return Embeds.getGeneric({
      title: '⚠ Warning ⚠',
      description: context,
      color: COLORS.WARNING,
    });
  }

  public static linkWarning(context: Set<string>): MessageEmbed {
    const links = context.values();
    let res = 'This message has links, be sure to double'
      + ' check the domains properly and that it\'s not a redirect.'
      + '\n\n**Domains Referenced**\n';
    let linkOpt = links.next();
    while (!linkOpt.done) {
      const link = new URL(linkOpt.value);
      res += ` • **${link.host}**\n`;
      linkOpt = links.next();
    }

    return Embeds.warning(res);
  }

  public static memberRoleRemove(
    member: GuildMember,
    role: DRole,
  ): MessageEmbed {
    const embed = Embeds.memberRoleAdd(member, role);
    embed.description = `${member} lost the "${role.name}" role.`;

    return embed;
  }

  /**
   * All embeds share the attributes returned here.
   * @returns {MessageEmbed}
   */
  public static memberLeft(user: User): MessageEmbed {
    return Embeds.getGeneric({
      title: 'User left the server',
      description: `${user} left the server`,
      color: COLORS.INTERNAL,
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
      color: COLORS.INTERNAL,
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
      color: COLORS.INTERNAL,
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

    embed.color = COLORS.RECEIVE;

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
      color: COLORS.INTERNAL,
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
      color: COLORS.BAD,
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
}
