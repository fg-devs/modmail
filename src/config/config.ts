import fs from 'fs';
import * as yaml from 'js-yaml';
import { Conf } from './conf';
import DBConfig from './dbconfig';
import validate from './validate';

/**
 * This represents the config.yml
 * @class Config
 * @property {string} token
 * @property {string} prefix
 * @property {string[]} owners
 * @property {DBConfig} database
 */
export default class Config extends Conf {
    public readonly token: string;

    public readonly prefix: string;

    public readonly owners: string[];

    public readonly database: DBConfig;

    constructor() {
      super('config');
      this.token = '';
      this.prefix = '';
      this.owners = [''];
      this.database = new DBConfig();
    }

    /**
     * @throws {Error} If an attribute is missing from the config.yml
     */
    public static getConfig(): Config {
      const fileContents = fs.readFileSync('./config.yml', 'utf-8');
      const casted = yaml.safeLoad(fileContents) as Config;

      validate<Config>(new Config(), casted);
      validate<DBConfig>(new DBConfig(), casted.database);

      return casted;
    }
}
