import { ServerMessage } from 'modmail-types';
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
      await this.getRoles(guildID, memberID);
    }
  }

  /**
   * Get a member for the modmail server
   * @param guildID
   * @param userID
   */
  public async getRoles(guildID: string, userID: string): Promise<void> {
    try {
      const guild = await this.modmail.guilds.fetch(guildID, true);
      const member = await guild.member(userID);

      if (member === null) {
        this.parent.postMessage([]);
        return;
      }
      const roles = member.roles.cache.map((r) => r.id);
      this.parent.postMessage(roles);
    } catch (_) {
      this.parent.postMessage([]);
    }
  }
}
