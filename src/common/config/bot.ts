import Conf from './conf';

export default class BotConfig extends Conf {
  public readonly token: string;

  public readonly prefix: string;

  public readonly owners: string[];

  constructor() {
    super('bot');
    this.token = '';
    this.prefix = '!';
    this.owners = ['Owner ID 1', 'Owner ID 2'];
  }
}
