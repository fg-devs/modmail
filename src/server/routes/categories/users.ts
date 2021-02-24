import { Response, Router } from 'express';
import { RequestWithCategory } from '../../models/types';
import ModmailServer from '../../controllers/server';
import Route from '../../models/route';
import {
  RoleLevel,
  Thread,
  UserState,
  Message,
} from '@Floor-Gang/modmail-types';

export default class UsersRoute extends Route {
  constructor(mm: ModmailServer) {
    const router = Router();
    super(mm, 'users', router);
  }

  public async getUser(
    req: RequestWithCategory,
    res: Response,
  ): Promise<void> {
    const { userID } = req.params;
    const bot = this.modmail.getBot();
    const user = await bot.getUser(userID);

    await this.sendState<UserState>(res, user);
  }

  public async getHistory(
    req: RequestWithCategory,
    res: Response,
  ): Promise<void> {
    const { member } = req.session;

    if (member === undefined) {
      this.failUnknown(res);
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
