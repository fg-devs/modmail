import { Message } from 'discord.js';
import { Command, CommandoMessage } from 'discord.js-commando';
import Modmail from '../Modmail';
import LogUtil from '../util/Logging';

export default class IssueHandler {
  /**
   * Log command failures
   * @param {Command} _c Command that failed
   * @param {Error} err Error that ocurred
   * @param {CommandoMessage} msg The user's message that executed the command
   */
  public onCommandError(
    c: Command,
    err: Error,
    msg: CommandoMessage,
    ...args: any[]
  ): void {
    const log = Modmail.getLogger(`(command) ${c.name}`);
    const message = `${msg.author.tag} executed "${msg.command?.name}"
${LogUtil.breakDownMsg(msg)}
${LogUtil.breakDownErr(err)}`;

    log.error(message);
  }

  /**
   * Log when a command was added to Modmail
   * @param {Command} c Command being added
   */
  public onCommandRegister(c: Command): void {
    const log = Modmail.getLogger(`(command) ${c.name}`);
    const message = 'registered';

    log.debug(message);
  }

  /**
   * Log command executions
   * @param {Command} c Command being executed
   * @param {Promise} _p Command's result
   * @param {CommandoMessage} msg The user's message that executed the command
   */
  public onCommandRun(
    c: Command,
    _p: Promise<Message | Message[] | null>,
    msg: CommandoMessage,
  ): void {
    const log = Modmail.getLogger(`(command) ${c.name}`);
    const message = `${msg.author.tag} executed this command\n`
    + `${LogUtil.breakDownMsg(msg)}`;

    log.debug(message);
  }
}
