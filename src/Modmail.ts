import { CommandoClient } from 'discord.js-commando';
import path from 'path';
import { Logger, getLogger } from 'log4js';
import { CONFIG } from './globals';
import EventHandler from './events/EventHandler';
import IssueHandler from './events/IssueHandler';
import DatabaseManager from './database/database';
import MessageController from './controllers/messages';
import ThreadController from './controllers/threads';
import Categories from './util/Categories';

export default class Modmail extends CommandoClient {
  public static catUtil: Categories;

  private static db: DatabaseManager | null;

  private readonly events: EventHandler;

  constructor() {
    super({
      commandPrefix: CONFIG.prefix,
      owner: CONFIG.owners,
    });

    const threadController = new ThreadController(this);
    const msgController = new MessageController(
      this,
      threadController,
    );

    Modmail.catUtil = new Categories(this);
    Modmail.db = null;
    this.events = new EventHandler(this, msgController);
    this.registerEvents();
    this.registry
      .registerDefaultTypes()
      .registerDefaultGroups()
      .registerDefaultCommands({
        unknownCommand: false,
        commandState: false,
        eval: false,
        ping: false,
        prefix: false,
      })
      .registerGroups([
        ['threads'],
        ['messages'],
        ['category'],
        ['muting'],
        ['standard_replies'],
        ['perms'],
      ])
      .registerCommandsIn(path.join(__dirname, 'commands'));
  }

  /**
   * This method must be called before anything else
   * @returns {Promise<void>}
   */
  public async start(): Promise<void> {
    Modmail.db = await DatabaseManager.getDB(this);
    await this.login(CONFIG.token);
  }

  /**
   * Get the database manager.
   * @method getDB
   * @returns {DatabaseManager}
   */
  public getDB(): DatabaseManager {
    if (Modmail.db !== null) {
      return Modmail.db;
    }
    throw new Error('getDB was called before starting Modmail.');
  }

  public static getDB(): DatabaseManager {
    if (Modmail.db !== null) {
      return Modmail.db;
    }
    throw new Error('getDB was called before starting Modmail.');
  }

  public static getCatUtil(): Categories {
    if (Modmail.catUtil !== null) {
      return Modmail.catUtil;
    }
    throw new Error('getCatUtil was called before initializing Modmail.');
  }

  /**
   * Get/create active logger
   * @param {string} section Where this logger is going to be used
   * @returns {Logger}
   */
  public static getLogger(section: string): Logger {
    const logger = getLogger(section);
    logger.level = CONFIG.logLevel;
    return logger;
  }

  /**
   * Register all the possible events that the bot would want to listen for.
   */
  private registerEvents() {
    const issues = new IssueHandler();
    this.on('commandError', issues.onCommandError.bind(issues))
      .on('commandRun', issues.onCommandRun.bind(issues))
      .on('commandRegister', issues.onCommandRegister.bind(issues));

    this.on('message', this.events.onMessage.bind(this.events))
      .on('messageDelete', this.events.onMessageDelete.bind(this.events))
      .on('messageUpdate', this.events.onMessageEdit.bind(this.events));

    this.on('guildMemberAdd', this.events.onMemberJoin.bind(this.events))
      .on('guildMemberRemove', this.events.onMemberLeave.bind(this.events));

    this.once('ready', this.events.onReady.bind(this.events));
  }
}
