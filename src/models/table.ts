import { Logger } from 'log4js';
import { PoolClient } from 'pg';
import { CONFIG } from '../globals';
import Modmail from '../Modmail';

/**
 * Table represents a table in the database which is used by DatabaseManager
 */
export default class Table {
    protected readonly pool: PoolClient;

    protected readonly modmail: Modmail;

    protected readonly name: string;

    constructor(modmail: Modmail, pool: PoolClient, name: string) {
      this.pool = pool;
      this.modmail = modmail;
      this.name = `${CONFIG.database.schema}.${name}`;
    }

    /**
     * This is called by the constructor, if the table exists then make sure
     * it doesn't need to be migrated. Otherwise create the table
     * @returns {Promise<void>}
     */
    public async validate(): Promise<void> {
      const res = await this.pool.query(
        'SELECT * FROM information_schema.tables'
        + ' WHERE table_schema=$1'
        + '   AND table_name = $2',
        [CONFIG.database.schema, this.name],
      );
      const log = this.getLogger();

      if (res.rowCount === 0) {
        log.info('Initializing');
        await this.init();
      } else {
        log.info('Checking if current table is in sync.');
        await this.migrate();
      }
    }

    protected getLogger(): Logger {
      return this.modmail.getLogger(`(table) ${this.name}`);
    }

    /**
     * Alter existing tables if needed
     * @returns {Promise<void>}
     */
    protected async migrate(): Promise<void> {
      const log = this.getLogger();
      log.info('No newer versions exist!');
    }

    /**
     * Initialize the table if it doesn't exist
     * @returns {Promise<void>}
     */
    protected async init(): Promise<void> {
      throw new Error(`Table init for ${this.name} has not been implemented.`);
    }
}
