import path from 'path';
import EventHandler from './events';
import IssueHandler from './issues';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { Logger, getLogger } from 'log4js';
import { parentPort } from 'worker_threads';
import { DatabaseManager } from '../database';
import { CONFIG } from '../globals';
import {
  Attachments,
  Categories,
  Messages,
  Threads,
  WorkerHandler,
} from '../controllers';

export default class ModmailBot extends CommandoClient {
  public readonly attachments: Attachments;

  public readonly categories: Categories;

  public readonly threads: Threads;

  public readonly messages: Messages;

  private readonly events: EventHandler;

  private static modmail: ModmailBot;

  private static db: DatabaseManager;

  constructor() {
    super({
      commandPrefix: CONFIG.bot.prefix,
      owner: CONFIG.bot.owners,
      presence: {
        activity: {
          type: 'PLAYING',
          name: 'DM me for Help!',
        }
      }

    });

    // Controllers
    this.attachments = new Attachments(this);
    this.categories = new Categories(this);
    this.messages = new Messages(this);
    this.threads = new Threads(this);

    // Globally accessible throughout the bot scope
    ModmailBot.db = new DatabaseManager(CONFIG.database);
    ModmailBot.modmail = this;

    // Event / command handlers
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
      .registerCommandsIn(path.join(__dirname, '/commands'));
  }

  /**
   * This method must be called before anything else
   * @returns {Promise<void>}
   */
  public async start(): Promise<void> {
    await ModmailBot.db.init();
    await this.login(CONFIG.bot.token);
  }

  public static getDB(): DatabaseManager {
    return ModmailBot.db;
  }

  /**
   * Get the instance of modmail
   */
  public static getModmail(): ModmailBot {
    if (ModmailBot.modmail !== null) {
      return ModmailBot.modmail;
    }
    throw new Error('getModmail was called before initializing Modmail.');
  }

  public static getLogger(section: string): Logger {
    const logger = getLogger(`ModmailBot::${section}`);
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
      .on('guildMemberRemove', this.events.onMemberLeave.bind(this.events))
      .on('guildMemberUpdate', this.events.onMemberUpdate.bind(this.events));

    this.once('ready', this.events.onReady.bind(this.events));

    if (parentPort) {
      const work = new WorkerHandler(this);

      parentPort.on('message', work.onMessage.bind(work));
    }
  }

  private inhibiter(msg: CommandoMessage): false | string {
    const passes = msg.content.startsWith(this.commandPrefix)
      && msg.guild !== null;

    return passes ? false : '';
  }
}
