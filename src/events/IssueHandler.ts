import { Message } from 'discord.js';
import { Command, CommandoMessage } from 'discord.js-commando';
import Modmail from '../Modmail';
import Util from '../util/Util';

export default class IssueHandler {
  /**
   * Log command failures
   * @param {Command} _c Command that failed
   * @param {Error} err Error that ocurred
   * @param {CommandoMessage} msg The user's message that executed the command
   */
  public static onCommandError(
    _c: Command,
    err: Error,
    msg: CommandoMessage,
  ): void {
    const log = Modmail.getLogger();
    const message = `${msg.author.tag} executed "${msg.command.name}"
${Util.breakDown(msg)}
 * Error: ${err.message}
 * Stack: ${err.stack}
`;

    log.error(message);
  }

  /**
   * Log command warning
   * @param {CommandoMessage} msg
   * @param {string} context
   */
  public static onCommandWarn(msg: CommandoMessage, context: string): void {
    const log = Modmail.getLogger();
    const message = `${msg.author.tag} executed "${msg.command.name}"
${Util.breakDown(msg)}
 * Context: ${context}`;

    log.warn(message);
  }

  /**
   * Log when a command was added to Modmail
   * @param {Command} cmd Command being added
   */
  public static onCommandRegister(cmd: Command): void {
    const log = Modmail.getLogger();
    const message = `registered "${cmd.name}"`;

    log.debug(message);
  }

  /**
   * Log command executions
   * @param {Command} _cmd Command being executed (not used)
   * @param {Promise} _p Command's status
   * @param {CommandoMessage} msg The user's message that executed the command
   */
  public static onCommandRun(
    _cmd: Command,
    _p: Promise<Message | Message[] | null>,
    msg: CommandoMessage,
  ): void {
    const log = Modmail.getLogger();
    const message = `${msg.author.tag} executed "${msg.command.name}"
${Util.breakDown(msg)}`;

    log.debug(message);
  }
}
