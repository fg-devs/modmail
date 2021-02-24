import { Response, Router } from 'express';
import {
  RequestWithCategory,
} from '../../models/types';
import ModmailServer from '../../server';
import Route from '../../models/route';

export default class MembersRoute extends Route {
  constructor(mm: ModmailServer) {
    const router = Router();
    super(mm, 'members', router);
  }

  public async getMembers(
    req: RequestWithCategory,
    res: Response,
  ): Promise<void> {
    const { category } = req.session;

    if (category === undefined) {
      this.failBadReq(res);
      return;
    }

    try {
      const bot = this.modmail.getBot();
      const members = await bot.getMembers(category.guildID);

      res.json(members);
      res.end();
    } catch (e) {
      this.failBadReq(res, e);
    }
  }
}
