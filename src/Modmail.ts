import { CommandoClient } from 'discord.js-commando';
import path from 'path';
import { CONFIG } from './globals';
import { IDatabaseManager } from './models/interfaces';
import database from './database/database';
import EventHandler from './events/EventHandler';

export default class Modmail {
  private static db: IDatabaseManager | undefined;

  private readonly client: CommandoClient;

  private readonly events: EventHandler;

  constructor() {
    this.client = new CommandoClient({
      commandPrefix: CONFIG.prefix,
      owner: CONFIG.owners,
    });

    this.events = new EventHandler(this.client);

    this.client.registry
      .registerDefaultTypes()
      .registerDefaultGroups()
      .registerDefaultCommands({ unknownCommand: false })
      .registerGroups([
        ['threads'],
        ['messages'],
        ['category'],
        ['muting'],
      ])
      .registerCommandsIn(path.join(__dirname, 'commands'));

    // this.client.registry.registerCommands(
    //   [
    //     cmd.CloseThread,
    //     cmd.OpenThread,
    //     cmd.Reply,
    //     cmd.ReplyA,
    //   ],
    // );
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

  public async start(): Promise<void> {
    Modmail.db = await database.getDb();
    this.registerEvents();
    await this.client.login(CONFIG.token);
  }

  private registerEvents() {
    this.client.on('message', this.events.onMessage.bind(this.events));
    this.client.on('messageDelete', this.events.onMessageDelete.bind(this.events));
    this.client.on('messageUpdate', this.events.onMessageEdit.bind(this.events));

    this.client.on('guildMemberAdd', this.events.onMemberJoin.bind(this.events));
    this.client.on('guildMemberRemove', this.events.onMemberLeave.bind(this.events));

    this.client.once('ready', this.events.onReady.bind(this.events));
  }
}
