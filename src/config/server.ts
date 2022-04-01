import Conf from './conf';
import OAuth2Config from './oauth2';

export default class ServerConfig extends Conf {
  public readonly domain: string;

  public readonly port: number;

  public readonly appkey: string;

  public readonly oauth2: OAuth2Config;

  constructor() {
    super('server');

    this.domain = '';
    this.port = 8080;
    this.appkey = '';
    this.oauth2 = new OAuth2Config();
  }
}
