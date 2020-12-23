import { Pool, PoolClient } from 'pg';
import { CONFIG } from '../globals';
import {
  IAttachmentManager,
  ICategoryManger,
  IDatabaseManager,
  IEditsManager,
  IMessageManager,
  IMuteManager,
  IPermissionsManager,
  IStandardReplyManager,
  IThreadManager,
  IUserManager,
} from '../models/interfaces';
import EditManager from './tables/edits';
import MessageManager from './tables/messages';
import MuteManager from './tables/mutes';
import ThreadManager from './tables/threads';
import UsersManager from './tables/users';
import CategoryManager from './tables/categories';
import AttachmentManager from './tables/attachments';
import StandardReplyManager from './tables/standardReplies';
import PermManager from './tables/permissions';

export default class DatabaseManager implements IDatabaseManager {
    public readonly edits: IEditsManager;

    public readonly messages: IMessageManager;

    public readonly mutes: IMuteManager;

    public readonly threads: IThreadManager;

    public readonly users: IUserManager;

    public readonly categories: ICategoryManger;

    public readonly attachments: IAttachmentManager;

    public readonly standardReplies: IStandardReplyManager;

    public readonly permissions: IPermissionsManager;

    constructor(pool: PoolClient) {
      this.edits = new EditManager(pool);
      this.messages = new MessageManager(pool);
      this.mutes = new MuteManager(pool);
      this.threads = new ThreadManager(pool);
      this.users = new UsersManager(pool);
      this.categories = new CategoryManager(pool);
      this.attachments = new AttachmentManager(pool);
      this.standardReplies = new StandardReplyManager(pool);
      this.permissions = new PermManager(pool);
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
