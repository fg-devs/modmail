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
    const log = this.getLogger(msg.id);
    log.debug(`Received task "${msg.task}"`);

    try {
      if (msg.task === 'get_member_roles') {
        const [guildID, memberID] = msg.args;
        const data = this.getRoles(msg.id, guildID, memberID);
        const res: ServerResponse = {
          id: msg.id,
          data,
        };
        this.parent.postMessage(res);
      } else {
        throw new Error(`Unknown task "${msg.task}"`);
      }
    } catch (e) {
      const res: ServerResponse = {
        id: msg.id,
        data: e,
      };
      this.parent.postMessage(res);
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
  ): Promise<string[]> {
    const guild = await this.modmail.guilds.fetch(guildID, true);
    const member = await guild.members.fetch(userID);

    if (member === null) {
      throw new Error("That member isn't in this guild.");
    }

    return member.roles.cache.map((r) => r.id);
  }

  private getLogger(id: string) {
    return Modmail.getLogger(`(worker-task) ${id}`);
  }
}
