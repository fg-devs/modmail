import { Message } from 'discord.js';
import { Command, CommandoMessage } from 'discord.js-commando';
import ModmailBot from '../bot';
import LogUtil from '../util/Logging';
import { Logger } from 'log4js';

export default class IssueHandler {
  /**
   * Log command failures
   * @param {Command} cmd Command that failed
   * @param {Error} err Error that ocurred
   * @param {CommandoMessage} msg The user's message that executed the command
   * @param {any[]} _args Ignored arguments
   */
  public onCommandError(
    cmd: Command,
    err: Error,
    msg: CommandoMessage,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-explicit-any
    ..._args: any[]
  ): void {
    const log = this.getLogger(cmd);
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
    const log = this.getLogger(c);
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
    const log = this.getLogger(c);
    const message = `${msg.author.tag} executed this command\n`
    + `${LogUtil.breakDownMsg(msg)}`;

    log.debug(message);
  }

  private getLogger(c: Command): Logger {
    return ModmailBot.getLogger(`command::${c.name}`);
  }
}
