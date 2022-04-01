import Table from '../table';

export default class UsersTable extends Table {
  constructor() {
    super('users');
  }

  /**
   * Create a new ModmailUser
   * @param {string} id
   * @returns {Promise<void>}
   */
  public async create(id: string): Promise<void> {
    const client = this.getClient();
    await client.user.create({ data: { id } });
  }
}
