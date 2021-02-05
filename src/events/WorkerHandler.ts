import {
  GetMemberStateReq,
  GetRolesReq,
  MemberState,
  RoleLevel,
  ServerMessage,
  ServerResponse,
  WORKER_CALLS,
} from 'modmail-types';
import { parentPort, MessagePort } from 'worker_threads';
import Modmail from '../Modmail';
import * as PermUtil from '../util/Perms';

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
    let res: ServerResponse = {
      data: null,
      id: msg.id,
    };
    log.debug(`Received task "${msg.task}"`);

    try {
      if (msg.task === WORKER_CALLS.getRoles) {
        const req = msg as GetRolesReq;
        const [guildID, userID] = req.args;
        res.data = await this.getRoles(guildID, userID);
        this.parent.postMessage(res);
      } if (msg.task === WORKER_CALLS.getMember) {
        const req = msg as GetMemberStateReq;
        const [guildID, userID] = req.args;
        res.data = await this.getMemberState(guildID, userID);
      } else {
        throw new Error(`Unknown task "${msg.task}"`);
      }
    } catch (e) {
      res = {
        id: msg.id,
        data: e,
      };
    }
    log.debug('Sent:\n', res);
    this.parent.postMessage(res);
  }

  /**
   * Get a member for the modmail server
   * @param guildID
   * @param userID
   */
  public async getRoles(guildID: string, userID: string): Promise<string[]> {
    const guild = await this.modmail.guilds.fetch(guildID, true);
    const member = await guild.members.fetch(userID);

    if (member === null) {
      throw new Error("That member isn't in this guild.");
    }

    return member.roles.cache.map((r) => r.id);
  }

  public async getMemberState(
    guildID: string,
    userID: string,
  ): Promise<MemberState> {
    const pool = Modmail.getDB();
    const guild = await this.modmail.guilds.fetch(guildID, true);
    const member = await guild.members.fetch(userID);

    if (member === null) {
      throw new Error("That member isn't in this guild.");
    }
    const dRoles = member.roles.cache.map((r) => r.id);
    const roles = await pool.permissions.fetchFrom(dRoles);
    let roleState = '';

    for (let i = 0; i < roles.length; i += 1) {
      const role = roles[i];
      roleState = PermUtil.resolve(role.level);
      if (role.level === RoleLevel.Admin) {
        break;
      }
    }

    const state: MemberState = {
      avatarURL: member.user.avatarURL() || member.user.defaultAvatarURL,
      discriminator: member.user.discriminator,
      id: member.id,
      nickname: member.nickname || '',
      username: member.user.username,
      role: roleState,
    };

    return state;
  }

  private getLogger(id: string) {
    return Modmail.getLogger(`(worker-task) ${id}`);
  }
}
