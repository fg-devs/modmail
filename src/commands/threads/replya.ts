import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import { Message } from 'discord.js';

export default class ReplyA extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'anonymousreply',
      aliases: ['ar', 'anon'],
      description: 'Anonymously Reply to a user in modmail',
      group: 'threads',
      memberName: 'anonymous reply',
    });
  }

  public async run(msg: CommandoMessage): Promise<Message | Message[]> {
    return msg.say('Not implemented');
  }
}
