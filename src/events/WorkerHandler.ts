import { GuildMember } from 'discord.js';
import { stat } from 'fs';
import {
  GetAllMemberStatesReq,
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
      } if (msg.task === WORKER_CALLS.getAllMembers) {
        const req = msg as GetAllMemberStatesReq;
        const [guildID, after, limit] = req.args;
        res.data = await this.getAllMemberStates(guildID, after, limit);
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
    const guild = await this.modmail.guilds.fetch(guildID, true);
    const member = await guild.members.fetch(userID);

    if (member === null) {
      throw new Error("That member isn't in this guild.");
    }

    const roleState = await WorkerHandler.getRoleState(member);
    const state: MemberState = WorkerHandler.parseGuildMember(
      member,
      roleState,
    );

    return state;
  }

  public async getAllMemberStates(
    guildID: string,
    after = '',
    limit = 1000,
  ): Promise<MemberState[]> {
    const guild = await this.modmail.guilds.fetch(guildID, true);
    const tasks: Promise<string>[] = [];
    const states: MemberState[] = [];
    let members;

    if (after !== '') {
      members = guild.members.cache.values();
    } else {
      members = guild.members.cache
        .filter((m) => m.id > after)
        .values();
    }

    let iMember = members.next();
    let i = 0;
    while (!iMember.done && i < limit) {
      const fetchTask = WorkerHandler.getRoleState(iMember.value);
      tasks.push(fetchTask);
      iMember = members.next();
      i += 1;
    }

    const fetchTasks = await Promise.all(tasks);
    i = 0;
    while (i < fetchTasks.length) {
      const roleState = fetchTasks[i][1];
      states[i].role = roleState;
      i += 1;
    }

    return states;
  }

  private static parseGuildMember(
    member: GuildMember,
    role: string,
  ): MemberState {
    return {
      avatarURL: member.user.avatarURL() || member.user.defaultAvatarURL,
      discriminator: member.user.discriminator,
      id: member.id,
      nickname: member.nickname || '',
      username: member.user.username,
      role,
    };
  }

  private static async getRoleState(member: GuildMember): Promise<string> {
    const pool = Modmail.getDB();
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

    return roleState;
  }

  private getLogger(id: string) {
    return Modmail.getLogger(`(worker-task) ${id}`);
  }
}
