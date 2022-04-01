import { Response, Router } from 'express';
import {
  RequestWithCategory,
} from '../../types';
import ModmailServer from '../..';
import Route from '../../route';

export default class MembersRoute extends Route {
  constructor(mm: ModmailServer) {
    const router = Router();
    super(mm, 'members', router);
  }

  /**
   * For getting members of a Discord guild
   * GET /api/categories/:categoryID/members
   * @param  {RequestWithCategory} req
   * @param  {Response} res
   * @return {Promise<void>}
   */
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
    } catch (err) {
      const e = err as Error;
      this.failBadReq(res, e.message);
    }
  }
}
