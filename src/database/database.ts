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
    public readonly pool: Pool;

    public readonly edits: EditsManager;

    public readonly messages: MessagesTable;

    public readonly mutes: MutesTable;

    public readonly threads: ThreadsTable;

    public readonly users: UsersTable;

    public readonly categories: CategoriesTable;

    public readonly attachments: AttachmentsTable;

    public readonly standardReplies: StandardRepliesTable;

    public readonly permissions: PermissionsTable;

    constructor(config: PoolConfig) {
      const pool = new Pool(config);

      this.pool = pool;
      this.edits = new EditsManager(pool);
      this.messages = new MessagesTable(pool);
      this.mutes = new MutesTable(pool);
      this.threads = new ThreadsTable(pool);
      this.users = new UsersTable(pool);
      this.categories = new CategoriesTable(pool);
      this.attachments = new AttachmentsTable(pool);
      this.standardReplies = new StandardRepliesTable(pool);
      this.permissions = new PermissionsTable(pool);
    }

    public async init(): Promise<void> {
      const client = await this.pool.connect();
      const tasks: Promise<void>[] = [];


      await client.query(
        `CREATE SCHEMA IF NOT EXISTS modmail`,
      );
      
      try { 
        await client.query(
          `CREATE TYPE modmail.file_type AS ENUM ('image', 'file');`,
        );

        await client.query(
          `CREATE TYPE modmail.role_level AS ENUM ('admin', 'mod');`,
        );
      } catch (_) {
        /* ignore these errors */
      } finally {
        client.release();
      }

      // Initialize users first
      await this.users.validate();
      // Initialize categories second
      await this.categories.validate();
      // Initialize threads third
      await this.threads.validate();
      // Initialize messages fourth
      await this.messages.validate();

      // Initialize everything else
      tasks.push(this.attachments.validate());
      tasks.push(this.edits.validate());
      tasks.push(this.mutes.validate());
      tasks.push(this.permissions.validate());
      tasks.push(this.standardReplies.validate());

      await Promise.all(tasks);
    }
}
