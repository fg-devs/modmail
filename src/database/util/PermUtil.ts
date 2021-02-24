import { RoleLevel } from '@Floor-Gang/modmail-types';

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
