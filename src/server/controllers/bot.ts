import {
  GetMemberStateReq,
  GetRolesReq,
  ServerResponse,
  ServerMessage,
  WORKER_CALLS,
  MemberState,
  GetAllMemberStatesReq,
  UserState,
  GetStateReq,
  ChannelState,
  RoleState,
  GetStateRes,
} from '@Floor-Gang/modmail-types';
import { Worker } from 'worker_threads';
import { v1 as uuid } from 'uuid';
import { Logger } from 'log4js';
import { MAX_LISTENERS, MAX_RESPONSE_TIME } from '../../common/globals';
import { Semaphore } from 'async-mutex';
import ModmailServer from '../server';

export default class BotController {
  private readonly bot: Worker;

  private readonly listeners: Semaphore;

  private readonly modmail: ModmailServer;

  constructor(modmail: ModmailServer, location: string) {
    this.bot = new Worker(location);
    this.listeners = new Semaphore(MAX_LISTENERS);
    this.bot.setMaxListeners(MAX_LISTENERS);
    this.modmail = modmail;
  }

  public async getChannel(
    channelID: string,
    cacheOnly = false,
  ): Promise<ChannelState | null> {
    return this.getState<ChannelState>(
      WORKER_CALLS.getChannel,
      channelID,
      cacheOnly,
    );
  }

  public async getRole(
    roleID: string,
    cacheOnly = false,
  ): Promise<RoleState | null> {
    return this.getState<RoleState>(
      WORKER_CALLS.getRole,
      roleID,
      cacheOnly,
    );
  }

  public async getUser(
    userID: string,
    cacheOnly = false,
  ): Promise<UserState | null> {
    return this.getState<UserState>(
      WORKER_CALLS.getUserState,
      userID,
      cacheOnly,
    );
  }

  public async getRoles(guildID: string, memberID: string): Promise<string[]> {
    const task: GetRolesReq = {
      args: [guildID, memberID],
      task: WORKER_CALLS.getRoles,
      id: uuid(),
    };
    const resp = await this.transaction(task);

    return resp.data as string[];
  }

  public async getMember(guildID: string, memberID: string): Promise<MemberState> {
    const task: GetMemberStateReq = {
      args: [guildID, memberID],
      task: WORKER_CALLS.getMember,
      id: uuid(),
    };
    const resp = await this.transaction(task);

    return resp.data as MemberState;
  }

  public async getMembers(
    guildID: string,
    after = '',
    limit = 1000,
  ): Promise<MemberState[]> {
    const task: GetAllMemberStatesReq = {
      args: [guildID, after, limit],
      task: WORKER_CALLS.getAllMembers,
      id: uuid(),
    };
    const resp = await this.transaction(task);

    return resp.data as MemberState[];
  }

  private async getState<T>(
    apiCall: string,
    id: string,
    cacheOnly = false,
  ): Promise<T | null> {
    const logger = this.getLogger();
    const task: GetStateReq = {
      args: [id, cacheOnly],
      task: apiCall,
      id: uuid(),
    };

    try {
      const resp: GetStateRes<T> = await this.transaction(task);
      return resp.data;
    } catch (e) {
      if (!e.message.includes('not in cache')) {
        logger.error(`[${task.id}] An error has occurred\n`, e);
      } else {
        logger.debug(`[${task.id}] Entity not in cache\n`, e);
      }
      return null;
    }
  }

  private getLogger(): Logger {
    return this.modmail.getLogger(`(controller) bot`);
  }

  private async transaction(req: ServerMessage): Promise<ServerResponse> {
    const [, release] = await this.listeners.acquire();
    try {
      const result = await new Promise<ServerResponse>((res, rej) => {
        const callback = (msg: ServerResponse) => {
          if (msg.id !== req.id) {
            return;
          }
          if (msg.data instanceof Error) {
            rej(msg.data);
          } else {
            res(msg);
          }
          this.bot.removeListener('done', callback);
        };
        this.bot.addListener('message', callback);
        this.bot.postMessage(req);
        setTimeout(() => {
          rej(new Error('Max response time was met, no data was provided.'));
          this.bot.removeListener('error', callback);
        }, MAX_RESPONSE_TIME);
      });
      release();
      return result;
    } finally {
      release();
    }
  }
}
