import { PoolClient } from 'pg';

export default class Table {
    protected readonly pool: PoolClient;

    constructor(pool: PoolClient) {
      this.pool = pool;
    }
}
