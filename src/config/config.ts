import fs from 'fs';
import * as yaml from 'js-yaml';
import BotConfig from './botconfig';
import Conf from './conf';
import DBConfig from './dbconfig';
import validate from './validate';

/**
 * This represents the config.yml
 * @class Config
 * @property {BotConfig} bot
 * @property {DBConfig} database
 * @property {string} logLevel Options: debug, warn, info, error
 */
export default class Config extends Conf {
    public readonly bot: BotConfig;

    public readonly database: DBConfig;

    public readonly logLevel: string;

    private static location = process.env.CONFIG || './config.yml';

    constructor() {
      super('config');
      this.logLevel = 'debug';
      this.database = new DBConfig();
      this.bot = new BotConfig();
    }

    /**
     * @throws {Error} If an attribute is missing from the config.yml
     */
    public static getConfig(): Config {
      const fileContents = fs.readFileSync(Config.location, 'utf-8');
      const casted = yaml.safeLoad(fileContents) as Config;

      validate<Config>(new Config(), casted);
      validate<DBConfig>(new DBConfig(), casted.database);
      validate<BotConfig>(new BotConfig(), casted.bot);

      return casted;
    }
}
