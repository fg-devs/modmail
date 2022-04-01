import {
  Command as CommandoCommand,
  CommandoMessage,
} from 'discord.js-commando';
import { Message } from 'discord.js';

export default class Command extends CommandoCommand {
  public async onBlock(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _msg: CommandoMessage,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _r: string,
    // eslint-disable-next-line @typescript-eslint/ban-types,@typescript-eslint/no-unused-vars
    _d?: object,
  ): Promise<Message[]> {
    return [];
  }
}
