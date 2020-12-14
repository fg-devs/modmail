import { Message } from 'discord.js';
import { CommandoClient } from 'discord.js-commando';
import ThreadHandler from './ThreadHandling';
import Modmail from '../Modmail';

export default class EventHandler {
  private readonly client: CommandoClient

  constructor(client: CommandoClient) {
    this.client = client;
  }

  public async onMessage(msg: Message): Promise<void> {
    const pool = await Modmail.getDB();

    if ((msg.channel.type === 'dm') && (!msg.author.bot)) {
      const thread = await pool.threads.getCurrentThread(msg.author.id);

      if (thread === undefined) {
        await ThreadHandler.createNewThread(pool, this.client, msg);
      } else {
        await ThreadHandler.clientSendMessage(pool, this.client, msg, thread);
      }
    }
  }

  public async onReady(): Promise<void> {
    console.log('Bot is ready');
    this.client.user?.setPresence({ activity: { type: 'PLAYING', name: 'DM me for Help!' } });
  }
}
