import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import { Message } from 'discord.js';

export default class OpenThread extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'openthread',
      aliases: ['contact', 'create', 'newthread', 'open'],
      description: 'Open a thread',
      group: 'threads',
      memberName: 'contact',
    });
  }

  public async run(msg: CommandoMessage): Promise<Message | Message[]> {
    return msg.say('Not implemented');
  }
}
