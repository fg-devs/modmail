/* eslint-disable max-classes-per-file */
import { CategoryChannel } from 'discord.js';

/**
 * @class CategoryConstraint
 * CategortyConstraint explains a certain constraint error.
 */
export class CategoryConstraint {
  /**
   * Someone attempted to insert an emoji that already exists.
   * @param {string} emote The emote attempted to be inserted
   * @returns {string}
   */
  public static emote(emote: string): string {
    return `${emote} is already assigned to a category.`;
  }

  /**
   * The channel category is already associated with a category
   * @param {string} channel The channel category
   * @returns {string}
   */
  public static channelID(channel: CategoryChannel): string {
    return `${channel.name} is already assigned to a category.`;
  }

  /**
   * The provided category name already exists
   * @param {string} name The duplicate name
   * @returns {string}
   */
  public static catName(name: string): string {
    return `"${name}" is already a category.`;
  }

  /**
   * Somehow the snowflake generator created a duplicate snowflake. This is
   * highly unlikely.
   * @returns {string}
   */
  public static id(): string {
    return 'How did we get here?';
  }
}
