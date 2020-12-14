import { Conf } from './conf';

export default class DBConfig extends Conf {
  public readonly host: string;

  public readonly port: number;

  public readonly username: string;

  public readonly password: string;

  public readonly schema: string;

  public readonly database: string;

  constructor() {
    super('database');
    this.host = 'localhost';
    this.port = 5432;
    this.username = 'modmail';
    this.password = '1234';
    this.schema = 'modmail';
    this.database = 'postgres';
  }
}
