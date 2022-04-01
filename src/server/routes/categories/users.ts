import { Response, Router } from 'express';
import {
  Message,
} from '@prisma/client';
import {
  UserState,
} from '@newcircuit/modmail-types';
import { RequestWithCategory } from '../../types';
import ModmailServer, { ThreadWithMessages } from '../..';
import Route from '../../route';

export default class UsersRoute extends Route {
  constructor(mm: ModmailServer) {
    const router = Router();
    super(mm, 'users', router);
  }

  /**
   * For getting data on a certain user on Discord
   * GET /api/categories/:categoryID/users/:userID
   * @param  {RequestWithCategory} req
   * @param  {Response} res
   * @return {Promise<void>}
   */
  public async getUser(
    req: RequestWithCategory,
    res: Response,
  ): Promise<void> {
    const { userID } = req.params;
    const bot = this.modmail.getBot();
    const user = await bot.getUser(userID);

    await this.sendState<UserState>(res, user);
  }

  /**
   * Get a user's thread history
   * GET /api/categories/:categoryID/users/:userID/history
   * @param  {RequestWithCategory} req
   * @param  {Response} res
   * @return {Promise<void>}
   */
  public async getHistory(
    req: RequestWithCategory,
    res: Response,
  ): Promise<void> {
    const { member } = req.session;

    if (member === undefined) {
      res.status(401);
      res.end();
      return;
    }

    // TODO(dylhack): FIX
    const { categoryID, userID } = req.params;
    const pool = this.modmail.getDB();
    const userIDs = new Set<string>();
    let threads = (await pool.threads.history(userID, categoryID))
      .map<ThreadWithMessages>((th) => ({ ...th, messages: [] }));

    threads = threads.filter((th: ThreadWithMessages) => {
      const passes = (th.isAdminOnly && member.role === 'admin')
        || (!th.isAdminOnly);

      if (passes) {
        th.messages.forEach((msg: Message) => userIDs.add(msg.senderId));
        userIDs.add(th.authorId);
      }
      return passes;
    });
    threads = await this.modmail.getLastMessages(threads);
    const users = this.modmail.getUserCache(userIDs.values());

    res.json({
      threads,
      users,
    });
    res.end();
  }
}
