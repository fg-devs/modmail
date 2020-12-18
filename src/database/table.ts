import { PoolClient } from 'pg';

/**
 * Table represents a table in the database which is used by DatabaseManager
 * @class Table
 * @property {PoolClient} pool
 */
export default class Table {
    protected readonly pool: PoolClient;

    constructor(pool: PoolClient) {
      this.pool = pool;
    }
}
