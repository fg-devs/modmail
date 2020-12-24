import { Pool, PoolClient } from 'pg';
import { CONFIG } from '../globals';
import EditManager from './tables/edits';
import MessageManager from './tables/messages';
import MuteManager from './tables/mutes';
import ThreadManager from './tables/threads';
import UsersManager from './tables/users';
import CategoryManager from './tables/categories';
import AttachmentManager from './tables/attachments';
import StandardReplyManager from './tables/standardReplies';
import PermsManager from './tables/permissions';
import Modmail from '../Modmail';

export default class DatabaseManager {
    public readonly edits: EditManager;

    public readonly messages: MessageManager;

    public readonly mutes: MuteManager;

    public readonly threads: ThreadManager;

    public readonly users: UsersManager;

    public readonly categories: CategoryManager;

    public readonly attachments: AttachmentManager;

    public readonly standardReplies: StandardReplyManager;

    public readonly permissions: PermsManager;

    constructor(modmail: Modmail, pool: PoolClient) {
      this.edits = new EditManager(modmail, pool);
      this.messages = new MessageManager(modmail, pool);
      this.mutes = new MuteManager(modmail, pool);
      this.threads = new ThreadManager(modmail, pool);
      this.users = new UsersManager(modmail, pool);
      this.categories = new CategoryManager(modmail, pool);
      this.attachments = new AttachmentManager(modmail, pool);
      this.standardReplies = new StandardReplyManager(modmail, pool);
      this.permissions = new PermsManager(modmail, pool);
    }

    public static async getDB(modmail: Modmail): Promise<DatabaseManager> {
      const pool = new Pool({
        host: CONFIG.database.host,
        port: CONFIG.database.port,
        user: CONFIG.database.username,
        password: CONFIG.database.password,
        database: CONFIG.database.database,
      });

      const poolClient = await pool.connect();
      const db = new DatabaseManager(modmail, poolClient);
      const tasks: Promise<void>[] = [];

      // Initialize schema and enums
      await DatabaseManager.init(poolClient);
      // Initialie users first
      await db.users.validate();
      // Initialize categories second
      await db.categories.validate();
      // Intiialize threads third
      await db.threads.validate();
      // Initialize messages fourth
      await db.messages.validate();

      // Initialize everything else
      tasks.push(db.attachments.validate());
      tasks.push(db.edits.validate());
      tasks.push(db.mutes.validate());
      tasks.push(db.permissions.validate());
      tasks.push(db.standardReplies.validate());

      await Promise.all(tasks);
      return db;
    }

    private static async init(pool: PoolClient): Promise<void> {
      const { schema } = CONFIG.database;
      await pool.query(
        `CREATE SCHEMA ${schema}`,
      );

      await pool.query(
        `create type ${schema}.file_type as enum ('image', 'file');`,
      );

      await pool.query(
        `create type ${schema}.role_level as enum ('admin', 'mod');`,
      );
    }
}
