/**
 * @class Conf
 * @property {string} name Property of config.yml
 */
export default class Conf {
  public readonly name: string;

  constructor(name: string) {
    this.name = name;
  }
}
