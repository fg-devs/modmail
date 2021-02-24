import {
  Command as CommandoCommand,
  CommandoMessage,
} from 'discord.js-commando';
import { Message } from 'discord.js';

export default class Command extends CommandoCommand {
  public async onBlock(
    _msg: CommandoMessage,
    _r: string,
    // eslint-disable-next-line @typescript-eslint/ban-types
    _d?: object,
  ): Promise<Message[]> {
    return [];
  }
}
