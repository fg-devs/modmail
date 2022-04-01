import {
  Response,
  Router,
} from 'express';
import ModmailServer from '..';
import Route from '../route';
import { RequestWithUser } from '../types';

/**
 * This route is for fetching data about the OAuth token being utilized
 */
export default class SelfRoute extends Route {
  constructor(mm: ModmailServer) {
    const router = Router();
    super(mm, 'self', router);
  }

  public getRouter(): Router {
    this.router.get('/', this.root.bind(this));

    return this.router;
  }

  /**
   * GET /api/self
   * @param {RequestWithUser} req
   * @param {Response} res
   */
  private async root(req: RequestWithUser, res: Response) {
    const logger = this.getLogger();
    const { user } = req.session;

    if (!user) {
      res.status(403);
      res.end();
      return;
    }

    try {
      res.json(user);
    } catch (err) {
      logger.error(err);
      res.status(500);
    } finally {
      res.end();
    }
  }
}
