import Conf from './conf';

export default class ServerConfig extends Conf {
  public readonly accessTokenUri: string;

  public readonly authorizationUri: string;

  public readonly redirectUri: string;

  public readonly clientId: string;

  public readonly clientSecret: string;

  public readonly scopes: string[];

  constructor() {
    super('server');

    this.accessTokenUri = '';
    this.authorizationUri = '';
    this.redirectUri = '';
    this.clientId = '';
    this.clientSecret = '';
    this.scopes = [];
  }
}
