import {
  Response,
  Router,
} from 'express';
import ModmailServer from '../server';
import Route from './route';
import { RequestWithUser } from '../models/types';

/**
 * Utilized for destroying the user's cookies
 * POST /api/logout
 */
export default class LogoutRoute extends Route {
  constructor(mm: ModmailServer) {
    const router = Router();
    super(mm, 'logout', router);
  }

  public getRouter(): Router {
    this.router.post('/', this.root.bind(this));

    return this.router;
  }

  private async root(req: RequestWithUser, res: Response) {
    const logger = this.getLogger();
    req.session.destroy((e: Error) => logger.error(e));
    res.status(200);
    res.end();
  }
}
