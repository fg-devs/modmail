import Conf from './conf';

export default class DBConfig extends Conf {
  public readonly host: string;

  public readonly port: number;

  public readonly user: string;

  public readonly password: string;

  public readonly database: string;

  public readonly max: number;

  constructor() {
    super('database');
    this.host = 'localhost';
    this.port = 5432;
    this.user = 'modmail';
    this.password = '1234';
    this.database = 'postgres';
    this.max = 20;
  }
}
