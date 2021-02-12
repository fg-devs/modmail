/* eslint-disable no-await-in-loop */
import { Command, CommandoMessage } from 'discord.js-commando';
import { Message, TextChannel } from 'discord.js';
import Modmail from '../../Modmail';
import Embeds from '../../util/Embeds';
import { CLOSE_THREAD_DELAY } from '../../globals';
import LogUtil from '../../util/Logging';

export default class Forward extends Command {
  constructor(client: Modmail) {
    super(client, {
      name: 'forward',
      description: 'Forward a thread to a new category',
      group: 'threads',
      memberName: 'forward',
      guildOnly: true,
    });
  }

  public async run(msg: CommandoMessage): Promise<Message | Message[] | null> {
    // TODO(dylan): fix
    throw new Error('Temporarily broken');
    return null;
  }
}
