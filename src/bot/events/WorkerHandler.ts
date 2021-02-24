import {
  Guild, GuildChannel,
  GuildMember,
  Role,
  User,
} from 'discord.js';
import {
  ChannelState,
  GetAllMemberStatesReq,
  GetMemberStateReq,
  GetRolesReq, GetStateReq,
  MemberState,
  RoleLevel, RoleState,
  ServerMessage,
  ServerResponse,
  UserState,
  WORKER_CALLS,
} from '@Floor-Gang/modmail-types';
import { parentPort, MessagePort } from 'worker_threads';
import ModmailBot from '../controllers/bot';
import * as PermUtil from '../util/Perms';

export default class WorkerHandler {
  private readonly modmail: ModmailBot;

  private readonly parent: MessagePort;

  constructor(modmail: ModmailBot) {
    this.modmail = modmail;
    if (!parentPort) {
      throw new Error('No parent port');
    }

    this.parent = parentPort;
  }

  public async onMessage(msg: ServerMessage): Promise<void> {
    const log = WorkerHandler.getLogger(msg.id);
    const res: ServerResponse = {
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
        // Get a user
      } else if (msg.task === WORKER_CALLS.getUserState) {
        const req = msg as GetStateReq;
        const [userID, cacheOnly] = req.args;
        res.data = await this.getUserState(userID, cacheOnly);
        // Get a role
      } else if (msg.task === WORKER_CALLS.getRole) {
        const req = msg as GetStateReq;
        const [roleID, cacheOnly] = req.args;
        res.data = await this.getRoleState(roleID, cacheOnly);
        // Get a channel
      } else if (msg.task === WORKER_CALLS.getChannel) {
        const req = msg as GetStateReq;
        const [channelID, cacheOnly] = req.args;
        res.data = await this.getChannelState(channelID, cacheOnly);
      } else {
        res.data = Error(`Unknown task "${msg.task}"`);
      }
    } catch (e) {
      res.data = e;
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
      throw new Error('That member isn\'t in this guild.');
    }

    return member.roles.cache.map((r) => r.id);
  }

  public async getChannelState(
    channelID: string,
    cacheOnly: boolean,
  ): Promise<ChannelState> {
    if (!cacheOnly) {
      const channel = await this.modmail.channels.fetch(channelID);
      return WorkerHandler.parseChannel(channel as GuildChannel);
    }

    const channel = this.modmail.channels.cache.get(channelID);
    if (channel === undefined) {
      throw new Error('Channel does not exist in cache.');
    }
    return WorkerHandler.parseChannel(channel as GuildChannel);
  }

  public async getRoleState(
    roleID: string,
    cacheOnly: boolean,
  ): Promise<RoleState> {
    const guilds = this.modmail.guilds.cache.values();
    const roleTasks: Promise<RoleState | null>[] = [];
    let guildOpt = guilds.next();

    while (!guildOpt.done) {
      const guild = guildOpt.value;
      const roleTask = WorkerHandler.getRole(roleID, guild, cacheOnly);
      roleTasks.push(roleTask);
      guildOpt = guilds.next();
    }

    const roles = await Promise.all(roleTasks);

    for (let i = 0; i < roles.length; i += 1) {
      const role = roles[i];
      if (role !== null && role.id === roleID) {
        return role;
      }
    }

    if (cacheOnly) {
      throw new Error('Role does not exist cache');
    }
    throw new Error('Role does not exist');
  }

  public async getUserState(
    userID: string,
    cacheOnly: boolean,
  ): Promise<UserState> {
    let user;
    if (cacheOnly) {
      user = this.modmail.users.cache.get(userID);
      if (user) {
        return WorkerHandler.parseUser(user);
      }
      throw new Error('User is not in cache.');
    }
    user = await this.modmail.users.fetch(userID, true);

    if (user === null) {
      throw new Error('That user doesn\'t in this guild.');
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
      throw new Error('That member isn\'t in this guild.');
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
        .filter((m: GuildMember) => m.id > after)
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

  private static parseChannel(channel: GuildChannel): ChannelState {
    return {
      name: channel.name,
      guildID: channel.guild.id,
      id: channel.id,
      isDeleted: channel.deleted,
      parentID: channel.parentID,
      type: channel.type,
    };
  }

  private static parseRole(role: Role): RoleState {
    return {
      name: role.name,
      color: role.color,
      id: role.id,
      position: role.position,
      guildID: role.guild.id,
    };
  }

  private static async getRoleState(member: GuildMember): Promise<string> {
    const pool = ModmailBot.getDB();
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

  private static async getRole(
    roleID: string,
    guild: Guild,
    cacheOnly: boolean,
  ): Promise<RoleState | null> {
    if (!cacheOnly) {
      const role = await guild.roles.fetch(roleID);
      if (role === null) {
        return null;
      }

      return WorkerHandler.parseRole(role);
    }

    const role = guild.roles.cache.get(roleID);
    if (role === undefined) {
      return null;
    }
    return WorkerHandler.parseRole(role);
  }

  private static getLogger(id: string) {
    return ModmailBot.getLogger(`(worker-task) ${id}`);
  }
}
