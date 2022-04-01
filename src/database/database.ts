import {
  Pool,
  PoolClient,
  PoolConfig,
} from 'pg';
import ModmailBot from '../bot';
import AttachmentsTable from './tables/attachments';
import CategoriesTable from './tables/categories';
import EditsManager from './tables/edits';
import MessagesTable from './tables/messages';
import MutesTable from './tables/mutes';
import PermissionsTable from './tables/permissions';
import StandardRepliesTable from './tables/standardReplies';
import ThreadsTable from './tables/threads';
import UsersTable from './tables/users';

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

    private static readonly ATTEMPTS = 5;

    private static readonly RECON_DELAY_MS = 5000;

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
      const log = ModmailBot.getLogger('database-init');
      let attempts = 0;
      let client: PoolClient | null = null;
      let finalError: Error | null = null;
      const reconnect = () => new Promise<PoolClient>((res) => {
        setTimeout(async () => {
          res(await this.pool.connect());
        }, DatabaseManager.RECON_DELAY_MS);
      });

      do {
        try {
          if (attempts === 0) {
            // eslint-disable-next-line no-await-in-loop
            client = await this.pool.connect();
          } else {
            log.warn(
              'Failed to connect to postgres, trying again in'
              + ` ${DatabaseManager.RECON_DELAY_MS / 1000} seconds.`,
            );
            // eslint-disable-next-line no-await-in-loop
            client = await reconnect();
          }
        } catch (err) {
          const e = err as Error;
          finalError = e;
        }
        attempts += 1;
      } while (attempts < DatabaseManager.ATTEMPTS && client === null);

      if (client === null) {
        throw finalError;
      }

      const tasks: Promise<void>[] = [];

      await client.query(
        'CREATE SCHEMA IF NOT EXISTS modmail',
      );

      try {
        await client.query(
          'CREATE TYPE modmail.file_type AS ENUM (\'image\', \'file\');',
        );

        await client.query(
          'CREATE TYPE modmail.role_level AS ENUM (\'admin\', \'mod\');',
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
