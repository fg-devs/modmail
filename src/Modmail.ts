import { DatabaseManager } from '@Floor-Gang/modmail-database';
import { parentPort } from 'worker_threads';
import { CommandoClient, CommandoMessage, Inhibition } from 'discord.js-commando';
import path from 'path';
import { Logger, getLogger } from 'log4js';
import { CONFIG } from './globals';
import EventHandler from './events/EventHandler';
import IssueHandler from './events/IssueHandler';
import CatController from './controllers/categories/categories';
import ThreadController from './controllers/threads/threads';
import MessageController from './controllers/messages/messages';
import AttachmentController from './controllers/attachments';
import WorkerHandler from './events/WorkerHandler';

export default class Modmail extends CommandoClient {
  public readonly attachments: AttachmentController;

  public readonly categories: CatController;

  public readonly threads: ThreadController;

  public readonly messages: MessageController;

  private readonly events: EventHandler;

  private static modmail: Modmail | null = null;

  private static db: DatabaseManager | null;

  constructor() {
    super({
      commandPrefix: CONFIG.bot.prefix,
      owner: CONFIG.bot.owners,
    });

    this.attachments = new AttachmentController(this);
    this.categories = new CatController(this);
    this.threads = new ThreadController(this);
    this.messages = new MessageController(this);

    Modmail.db = null;
    this.events = new EventHandler(this);
    this.registerEvents();
    this.dispatcher.addInhibitor(this.inhibiter.bind(this));
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
    Modmail.modmail = this;
  }

  /**
   * This method must be called before anything else
   * @returns {Promise<void>}
   */
  public async start(): Promise<void> {
    Modmail.db = await DatabaseManager.getDB(CONFIG.database);
    await this.login(CONFIG.bot.token);
  }

  public static getDB(): DatabaseManager {
    if (Modmail.db !== null) {
      return Modmail.db;
    }
    throw new Error('getDB was called before starting Modmail.');
  }

  /**
   * Get the instance of modmail
   */
  public static getModmail(): Modmail {
    if (Modmail.modmail !== null) {
      return Modmail.modmail;
    }
    throw new Error('getModmail was called before initializing Modmail.');
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

    if (parentPort) {
      const work = new WorkerHandler(this);

      parentPort.on('message', work.onMessage.bind(work));
    }
  }

  private inhibiter(msg: CommandoMessage): boolean | string {
    const passes = msg.content.startsWith(this.commandPrefix)
      && msg.guild !== null;

    return passes ? false : '';
  }
}
