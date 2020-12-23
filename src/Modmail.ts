import { CommandoClient } from 'discord.js-commando';
import path from 'path';
import { Logger, getLogger } from 'log4js';
import { CONFIG } from './globals';
import { IDatabaseManager } from './models/interfaces';
import database from './database/database';
import EventHandler from './events/EventHandler';
import IssueHandler from './events/IssueHandler';

export default class Modmail extends CommandoClient {
  private static db: IDatabaseManager | null;

  private static logger: Logger | null;

  private static client: CommandoClient | null;

  private readonly events: EventHandler;

  constructor() {
    super({
      commandPrefix: CONFIG.prefix,
      owner: CONFIG.owners,
    });

    this.events = new EventHandler(this);
    this.registerEvents();
    Modmail.client = this;
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
   * Get the database manager.
   * @method getDB
   * @returns {Promise<IDatabaseManager>}
   */
  public static async getDB(): Promise<IDatabaseManager> {
    if (Modmail.db) {
      return Modmail.db;
    }
    Modmail.db = await database.getDb();
    return Modmail.db;
  }

  /**
   * Get/create active logger
   * @returns {Logger}
   */
  public static getLogger(): Logger {
    if (Modmail.logger) {
      return Modmail.logger;
    }
    Modmail.logger = getLogger();
    Modmail.logger.level = CONFIG.logLevel;
    return Modmail.logger;
  }

  public static getClient(): CommandoClient {
    if (!Modmail.client) {
      throw new Error('Modmail.getClient was called before initializing');
    }
    return Modmail.client;
  }

  public async start(): Promise<void> {
    Modmail.db = await database.getDb();
    Modmail.logger = Modmail.getLogger();
    await this.login(CONFIG.token);
  }

  /**
   * Register all the possible events that the bot would want to listen for.
   */
  private registerEvents() {
    this.on('commandError', IssueHandler.onCommandError)
      .on('commandRun', IssueHandler.onCommandRun)
      .on('commandRegister', IssueHandler.onCommandRegister);

    this.on('message', this.events.onMessage.bind(this.events))
      .on('messageDelete', this.events.onMessageDelete.bind(this.events))
      .on('messageUpdate', this.events.onMessageEdit.bind(this.events));

    this.on('guildMemberAdd', this.events.onMemberJoin.bind(this.events))
      .on('guildMemberRemove', this.events.onMemberLeave.bind(this.events));

    this.once('ready', this.events.onReady.bind(this.events));
  }
}
