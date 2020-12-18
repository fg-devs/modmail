import { Pool, PoolClient } from 'pg';
import {
  ICategoryManger,
  IDatabaseManager, IEditsManager, IMessageManager, IMuteManager, IThreadManager, IUserManager,
} from '../models/interfaces';
import EditManager from './edits';
import MessageManager from './messages';
import MuteManager from './mutes';
import ThreadManager from './threads';
import UsersManager from './users';
import CategoryManager from './categories';
import { CONFIG } from '../globals';

export default class DatabaseManager implements IDatabaseManager {
    public readonly edits: IEditsManager;

    public readonly messages: IMessageManager;

    public readonly mutes: IMuteManager;

    public readonly threads: IThreadManager;

    public readonly users: IUserManager;

    public readonly categories: ICategoryManger;

    constructor(pool: PoolClient) {
      this.edits = new EditManager(pool);
      this.messages = new MessageManager(pool);
      this.mutes = new MuteManager(pool);
      this.threads = new ThreadManager(pool);
      this.users = new UsersManager(pool);
      this.categories = new CategoryManager(pool);
    }

    public static async getDb(): Promise<DatabaseManager> {
      const pool = new Pool({
        host: CONFIG.database.host,
        port: CONFIG.database.port,
        user: CONFIG.database.username,
        password: CONFIG.database.password,
        database: CONFIG.database.database,
      });

      const poolClient = await pool.connect();
      return new DatabaseManager(poolClient);
    }
}
