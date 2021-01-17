import { Command, CommandoMessage } from 'discord.js-commando';
import Modmail from '../Modmail';

export default class LogUtil {
  /**
   * This breaks down the details of a command that was executed
   * @param {CommandoMessage} msg The message that executed the command
   * @returns {string}
   */
  public static breakDownMsg(msg: CommandoMessage): string {
    return ` * Time: ${msg.createdAt}
 * Full: ${msg.command?.name} ${msg.parseArgs()}
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

  /**
   * Log a warning from a command
   * @param {CommandoMessage} msg
   * @param {string} context Added context
   */
  public static cmdWarn(msg: CommandoMessage, context: string): void {
    const log = LogUtil.getCmdLogger(msg.command as Command);
    const message = `${msg.author.tag} executed "${msg.command?.name}"

    ${LogUtil.breakDownMsg(msg)}
     * Context: ${context}`;
    log.warn(message);
  }

  private static getCmdLogger(c: Command) {
    return Modmail.getLogger(`(command) ${c.name}`);
  }
}
