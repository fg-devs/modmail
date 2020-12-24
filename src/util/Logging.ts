import { CommandoMessage } from 'discord.js-commando';

export default class LogUtil {
  /**
   * This breaks down the details of a command that was executed
   * @param {CommandoMessage} msg The message that executed the command
   * @returns {string}
   */
  public static breakDownMsg(msg: CommandoMessage): string {
    return ` * Time: ${msg.createdAt}
 * Full: ${msg.command.name} ${msg.parseArgs()}
 * Args: ${msg.parseArgs()}
 * Guild: ${msg.guild ? msg.guild.name : 'No Guild'}`;
  }

  /**
   * Break down an error to be read to log
   * @param {Error} err
   * @returns {string}
   */
  public static breakDownErr(err: Error): string {
    return ` * Error: ${err.message}\n * Stack: ${err.stack}`;
  }
}
