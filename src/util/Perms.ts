import { RoleLevel } from '@prisma/client';
import { CommandoMessage } from 'discord.js-commando';
import { CONFIG } from '../globals';
import ModmailBot from '../bot';

/**
 * This is where the perm checking magic happens. It makes sure that user
 * using a given command is a mod of the category where it's been executed.
 * @param {CommandoMessage} msg
 * @returns {Promise<RoleLevel | null>} Nullable if they're not even a mod
 */
async function checkRole(msg: CommandoMessage): Promise<RoleLevel | null> {
  if (!msg.member || !msg.guild) {
    return null;
  }
  const pool = ModmailBot.getDB();
  const category = await pool.categories.fetchByGuild(msg.guild.id);

  if (category === null) {
    return null;
  }

  const guild = await msg.client.guilds.fetch(category.guildId);

  if (!guild) {
    console.error(
      `Failed to resolve guild for category "${category.guildId}"`,
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
      if (ref.roleId === role.value.id) {
        return ref.level;
      }
    }

    role = roles.next();
  }

  return null;
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
        const hasAccess = hasRole === 'admin'
          || hasRole === required
          || CONFIG.bot.owners.includes(msg.author.id);
        if (hasAccess) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          return original.apply(this, args);
        }
        if (required === 'admin') {
          msg.say('You must be an admin to run this command.');
        } else {
          msg.say('You must be a mod to run this command.');
        }
        return null;
      });
    };
  };
}
