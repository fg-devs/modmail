import { IUserManager } from '../models/interfaces';
import Table from './table';

export default class UsersManager extends Table implements IUserManager {
  public async create(id: string): Promise<void> {
    await this.pool.query('INSERT INTO modmail.users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING;', [id]);
  }
}
