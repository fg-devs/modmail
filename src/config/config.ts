import * as fs from 'fs';
import * as yaml from 'js-yaml';
import BotConfig from './bot';
import Conf from './conf';
import DBConfig from './database';
import ServerConfig from './server';
import OAuth2Config from './oauth2';
import ClientsConfig from './clients';
import validate from './validate';

/**
 * This represents the config.yml
 */
export default class Config extends Conf {
    public readonly bot: BotConfig;

    public readonly database: DBConfig;

    public readonly logLevel: string;

    public readonly server: ServerConfig;

    public readonly clients: ClientsConfig;

    private static location = process.env.CONFIG || './config.yml';

    constructor() {
      super('config');
      this.logLevel = 'debug';
      this.database = new DBConfig();
      this.bot = new BotConfig();
      this.server = new ServerConfig();
      this.clients = new ClientsConfig();
    }

    /**
     * @throws {Error} If an attribute is missing from the config.yml
     */
    public static getConfig(): Config {
      const fileContents = fs.readFileSync(Config.location, 'utf-8');
      const casted = yaml.load(fileContents) as Config;

      validate<Config>(new Config(), casted);
      validate<DBConfig>(new DBConfig(), casted.database);
      validate<BotConfig>(new BotConfig(), casted.bot);
      validate<ServerConfig>(new ServerConfig(), casted.server);
      validate<OAuth2Config>(new OAuth2Config(), casted.server.oauth2);
      validate<ClientsConfig>(new ClientsConfig(), casted.clients);

      return casted;
    }
}
