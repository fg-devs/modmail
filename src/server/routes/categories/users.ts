import { Response, Router } from 'express';
import {
  RoleLevel,
  Thread,
  UserState,
  Message,
} from '@newcircuit/modmail-types';
import { RequestWithCategory } from '../../types';
import ModmailServer from '../..';
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

    const { categoryID, userID } = req.params;
    const pool = this.modmail.getDB();
    const userIDs = new Set<string>();
    let threads = await pool.threads.history(userID, categoryID);

    threads = threads.filter((th: Thread) => {
      const passes = (th.isAdminOnly && member.role === RoleLevel.Admin)
        || (!th.isAdminOnly);

      if (passes) {
        th.messages.forEach((msg: Message) => userIDs.add(msg.sender));
        userIDs.add(th.author.id);
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
