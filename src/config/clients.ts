import Conf from './conf';

export default class ClientsConfig extends Conf {
  public readonly attachmentsUri: string;

  constructor() {
    super('clients');

    this.attachmentsUri = 'localhost:59324';
  }
}
