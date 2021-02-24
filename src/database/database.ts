import AttachmentsTable from './tables/attachments';
import CategoriesTable from './tables/categories';
import EditsManager from './tables/edits';
import MessagesTable from './tables/messages';
import MutesTable from './tables/mutes';
import PermissionsTable from './tables/permissions';
import StandardRepliesTable from './tables/standardReplies';
import ThreadsTable from './tables/threads';
import UsersTable from './tables/users';
import {
  Pool,
  PoolClient,
  PoolConfig,
} from 'pg';

export default class DatabaseManager {
    public readonly edits: EditsManager;

    public readonly messages: MessagesTable;

    public readonly mutes: MutesTable;

    public readonly threads: ThreadsTable;

    public readonly users: UsersTable;

    public readonly categories: CategoriesTable;

    public readonly attachments: AttachmentsTable;

    public readonly standardReplies: StandardRepliesTable;

    public readonly permissions: PermissionsTable;

    private readonly pool: PoolClient;

    constructor(pool: PoolClient) {
      this.edits = new EditsManager(pool);
      this.messages = new MessagesTable(pool);
      this.mutes = new MutesTable(pool);
      this.threads = new ThreadsTable(pool);
      this.users = new UsersTable(pool);
      this.categories = new CategoriesTable(pool);
      this.attachments = new AttachmentsTable(pool);
      this.standardReplies = new StandardRepliesTable(pool);
      this.permissions = new PermissionsTable(pool);
      this.pool = pool;
    }

    public static async getDB(config: PoolConfig): Promise<DatabaseManager> {
      const pool = new Pool(config);

      const poolClient = await pool.connect();
      const db = new DatabaseManager(poolClient);
      const tasks: Promise<void>[] = [];

      // Initialize schema and enums
      await db.init();
      // Initialize users first
      await db.users.validate();
      // Initialize categories second
      await db.categories.validate();
      // Initialize threads third
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

    public async init(): Promise<void> {
      await this.pool.query(
        `CREATE SCHEMA IF NOT EXISTS modmail`,
      );

      try {
        await this.pool.query(
          `CREATE TYPE modmail.file_type AS ENUM ('image', 'file');`,
        );

        await this.pool.query(
          `CREATE TYPE modmail.role_level AS ENUM ('admin', 'mod');`,
        );
      } catch (_) { /* ignore these errors */ }
    }
}
