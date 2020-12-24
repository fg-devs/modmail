import djs, { CommandoMessage } from 'discord.js-commando';
import { Logger } from 'log4js';
import Modmail from '../Modmail';
import Categories from '../util/Categories';
import LogUtil from '../util/Logging';

export default class Command extends djs.Command {
  public readonly client: Modmail;

  protected readonly catUtil: Categories;

  constructor(client: Modmail, info: djs.CommandInfo) {
    super(client, info);
    this.client = client;
    this.catUtil = client.catUtil;
  }

  /**
   * Log to the console when something expected has gone wrong
   * @param {CommandoMessage} msg The message that caused it
   * @param {Error} err The error that was emitted
   */
  protected logError(msg: CommandoMessage, err: Error): void {
    const log = this.getLogger();
    const message = `${msg.author.tag} executed "${msg.command.name}"
${LogUtil.breakDownMsg(msg)}
${LogUtil.breakDownErr(err)}`;

    log.error(message);
  }

  /**
   * Warn to the console when someone might have gone wrong
   * @param {CommandoMessage} msg
   * @param {string} context Extra details
   */
  protected logWarning(msg: CommandoMessage, context: string): void {
    const log = this.getLogger();
    const message = `${msg.author.tag} executed "${msg.command.name}"
${LogUtil.breakDownMsg(msg)}
 * Context: ${context}`;

    log.warn(message);
  }

  /**
   * Get logger for a command
   * @returns {Logger}
   */
  protected getLogger(): Logger {
    return this.client.getLogger(`(command) ${this.name}`);
  }
}
