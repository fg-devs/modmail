import { RoleLevel } from '@Floor-Gang/modmail-types';
import { CommandoMessage } from 'discord.js-commando';
import { CONFIG } from '../globals';
import Modmail from '../Modmail';

/**
 * This is where the perm checking magic happens. It makes sure that user using
 * a given command is a mod of the category where it's been executed.
 * @param {CommandoMessage} msg
 * @returns {Promise<RoleLevel | null>} Nullable if they're not even a mod
 */
async function checkRole(msg: CommandoMessage): Promise<RoleLevel | null> {
  if (!msg.member || !msg.guild) {
    return null;
  }
  const pool = await Modmail.getDB();
  const category = await pool.categories.fetchByID(msg.guild.id);

  if (category === null) {
    return null;
  }

  const guild = await msg.client.guilds.fetch(category.guildID);

  if (!guild) {
    console.error(
      `Failed to resolve guild for category "${category.guildID}"`,
    );
    return null;
  }
  const member = guild.member(msg.author.id);

  if (!member) {
    return null;
  }

  const roles = member.roles.cache.values();
  const reference = await pool.permissions.fetchAll(category.id);
  let role = roles.next();

  while (!role.done) {
    for (let i = 0; i < reference.length; i += 1) {
      const ref = reference[i];
      if (ref.roleID === role.value.id) {
        return ref.level;
      }
    }

    role = roles.next();
  }

  return null;
}

/**
 * Converts a human readable string to a RoleLevel enum
 * @param {string} level
 * @returns {RoleLevel}
 * @throws {Error} if an invalid level was provided
 */
export function resolveStr(level: string): RoleLevel {
  switch (level) {
    case 'admin':
      return RoleLevel.Admin;
    case 'mod':
      return RoleLevel.Mod;
    default:
      throw new Error(
        `The role level "${level}" from the db isn't considered for.`,
      );
  }
}

/**
 * Converts RoleLevel enum to a human readable string
 * @param {RoleLevel} level
 * @returns {string}
 * @throws {Error} if an invalid level was provided
 */
export function resolve(level: RoleLevel): string {
  switch (level) {
    case RoleLevel.Admin:
      return 'admin';
    case RoleLevel.Mod:
      return 'mod';
    default:
      throw new Error('A role level provided was not considered for.');
  }
}

/**
 * Method decorator for checking user perms for a command. Use it above the
 * run method of a Command
 * @param {RoleLevel} required
 */
export function Requires(required: RoleLevel) {
  // eslint-disable-next-line max-len
  // eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/explicit-module-boundary-types
  return (_t: Object, _k: string | symbol, desc: PropertyDescriptor) => {
    const original = desc.value;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-param-reassign
    desc.value = (...args: any[]) => {
      const msg = args[0] as CommandoMessage;
      return checkRole(msg).then((hasRole) => {
        const hasAccess = hasRole === RoleLevel.Admin
          || hasRole === required
          || CONFIG.bot.owners.includes(msg.author.id);
        if (hasAccess) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          return original.apply(this, args);
        }
        if (required === RoleLevel.Admin) {
          msg.say('You must be an admin to run this command.');
        } else {
          msg.say('You must be a mod to run this command.');
        }
        return null;
      });
    };
  };
}
