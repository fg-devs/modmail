import { Guild, GuildMember } from 'discord.js';

export default class Members {
  /**
   * List roles of a member in a mention list fashion (see returns).
   * @param {GuildMember} member
   * @returns {string} "@mod, @admin"
   */
  public static listRoles(member: GuildMember): string {
    const roles = member.roles.cache.array();
    let res = roles.length === 0
      ? 'This user has no roles'
      : '';

    for (let i = 0; i < roles.length; i += 1) {
      const role = roles[i];

      res += `<@&${role.id}>`;

      if (i !== (roles.length - 1)) {
        res += ', ';
      }
    }

    return res;
  }

  public static async getMember(uid: string, guild: Guild): Promise<GuildMember> {
    let uidParsed = uid;
    if (uid.startsWith('<@') && uid.endsWith('>')) {
      const re = new RegExp('[<@!>]', 'g');
      uidParsed = uid.replace(re, '');
    }

    const res = await guild.members.fetch(uidParsed);
    if (res === undefined) {
      throw new Error('User not found, please check your arguments and try again');
    }
    return res;
  }
}
