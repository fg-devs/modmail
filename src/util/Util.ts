import { CommandoMessage } from 'discord.js-commando';

export default class Util {
  /**
   * This breaks down the details of a command that was executed
   * @param {CommandoMessage} msg The message that executed the command
   * @returns {string}
   */
  public static breakDown(msg: CommandoMessage): string {
    return ` * Time: ${msg.createdAt}
 * Full: ${msg.command.name} ${msg.parseArgs()}
 * Args: ${msg.parseArgs()}
 * Guild: ${msg.guild ? msg.guild.name : 'No Guild'}`;
  }
}
