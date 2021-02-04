import { ServerMessage, ServerResponse } from 'modmail-types';
import { parentPort, MessagePort } from 'worker_threads';
import Modmail from '../Modmail';

export default class WorkerHandler {
  private readonly modmail: Modmail;

  private readonly parent: MessagePort;

  constructor(modmail: Modmail) {
    this.modmail = modmail;
    if (!parentPort) {
      throw new Error('No parent port');
    }

    this.parent = parentPort;
  }

  public async onMessage(msg: ServerMessage): Promise<void> {
    if (msg.task === 'get_member_roles') {
      const [guildID, memberID] = msg.args;
      await this.getRoles(msg.id, guildID, memberID);
    }
  }

  /**
   * Get a member for the modmail server
   * @param guildID
   * @param userID
   */
  public async getRoles(
    id: string,
    guildID: string,
    userID: string,
  ): Promise<void> {
    const res: ServerResponse = {
      id,
      data: [],
    };
    try {
      const guild = await this.modmail.guilds.fetch(guildID, true);
      const member = await guild.members.fetch(userID);

      if (member === null) {
        this.parent.postMessage(res);
        return;
      }
      res.data = member.roles.cache.map((r) => r.id);
      this.parent.postMessage(res);
    } catch (_) {
      this.parent.postMessage(res);
    }
  }
}
