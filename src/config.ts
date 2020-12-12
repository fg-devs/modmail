import fs from 'fs';
import * as yaml from 'js-yaml';

export default class Config {
    public readonly token: string;

    public readonly prefix: string;

    constructor() {
      this.token = '';
      this.prefix = '';
    }

    /**
     * @throws {Error} If an attribute is missing from the config.yml
     */
    public static getConfig(): Config {
      const fileContents = fs.readFileSync('./config.yml', 'utf-8');
      const casted = <Config>yaml.safeLoad(fileContents);

      Config.validate(casted);

      return casted;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static validate(obj: any) {
      const reference = Object.keys(new Config());
      let hasMissingAttr = false;
      const objKeys = Object.keys(obj);

      for (let i = 0; i < reference.length; i += 1) {
        const key = reference[i];
        if (!(objKeys.includes(key))) {
          console.log(
            `The ${key} attribute is missing from config.yml.`
                    + 'See (docs/config.md)',
          );
          hasMissingAttr = true;
        }
      }

      if (hasMissingAttr) {
        throw new Error('config.yml has missing attributes see above');
      }
    }
}
