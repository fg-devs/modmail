import { GuildMember, User } from 'discord.js';
import {
  GetAllMemberStatesReq,
  GetMemberStateReq,
  GetRolesReq,
  GetUserStateReq,
  MemberState,
  RoleLevel,
  ServerMessage,
  ServerResponse,
  UserState,
  WORKER_CALLS,
} from '@Floor-Gang/modmail-types';
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
    const log = WorkerHandler.getLogger(msg.id);
    let res: ServerResponse = {
      data: null,
      id: msg.id,
    };
    log.debug(`Received task "${msg.task}":\n`, msg);

    try {
      // Get a roles of a member
      if (msg.task === WORKER_CALLS.getRoles) {
        const req = msg as GetRolesReq;
        const [guildID, userID] = req.args;
        res.data = await this.getRoles(guildID, userID);
        this.parent.postMessage(res);
        // Get a member
      } else if (msg.task === WORKER_CALLS.getMember) {
        const req = msg as GetMemberStateReq;
        const [guildID, userID] = req.args;
        res.data = await this.getMemberState(guildID, userID);
        // Get all member states
      } else if (msg.task === WORKER_CALLS.getAllMembers) {
        const req = msg as GetAllMemberStatesReq;
        const [guildID, after, limit] = req.args;
        res.data = await this.getAllMemberStates(guildID, after, limit);
      } else if (msg.task === WORKER_CALLS.getUserState) {
        const req = msg as GetUserStateReq;
        const [userID] = req.args;
        res.data = await this.getUserState(userID);
      } else {
        res.data = Error(`Unknown task "${msg.task}"`);
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

  public async getUserState(userID: string): Promise<UserState> {
    const user = await this.modmail.users.fetch(userID, true);

    if (user === null) {
      throw new Error("That user doesn't in this guild.");
    }

    return WorkerHandler.parseUser(user);
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
    return WorkerHandler.parseGuildMember(
      member,
      roleState,
    );
  }

  public async getAllMemberStates(
    guildID: string,
    after = '',
    limit = 1000,
  ): Promise<MemberState[]> {
    const guild = await this.modmail.guilds.fetch(guildID);
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
      const state = WorkerHandler.parseGuildMember(iMember.value, '');
      tasks.push(fetchTask);
      states.push(state);
      iMember = members.next();
      i += 1;
    }

    const fetchTasks = await Promise.all(tasks);
    i = 0;
    while (i < fetchTasks.length) {
      states[i].role = fetchTasks[i];
      i += 1;
    }

    return states;
  }

  private static parseGuildMember(
    member: GuildMember,
    role: string,
  ): MemberState {
    return {
      ...WorkerHandler.parseUser(member.user),
      role,
      nickname: member.nickname || '',
    };
  }

  private static parseUser(user: User): UserState {
    return {
      avatarURL: user.avatarURL() || user.defaultAvatarURL,
      discriminator: user.discriminator,
      id: user.id,
      username: user.username,
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

  private static getLogger(id: string) {
    return Modmail.getLogger(`(worker-task) ${id}`);
  }
}
