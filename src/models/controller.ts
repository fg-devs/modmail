import { Logger } from 'log4js';
import Modmail from '../Modmail';

/**
 * A Controller instance is responsible more managing a certain type of entity
 * that may exist in the Modmail ecosystem
 * @class Controller
 * @property {string} name Name of the controller (for logging purposes)
 * @property {Modmail} modmail Modmail to get a logger instance
 */
export default class Controller {
  private readonly name: string;

  protected readonly modmail: Modmail;

  constructor(modmail: Modmail, name: string) {
    this.name = name;
    this.modmail = modmail;
  }

  /**
   * Used by children of Controller to log certain details that may occur
   * @returns {Logger}
   */
  protected getLogger(): Logger {
    return Modmail.getLogger(`(controller) ${this.name}`);
  }
}
