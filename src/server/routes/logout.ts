import {
  Response,
  Router,
} from 'express';
import ModmailServer from '../server';
import Route from '../models/route';
import { RequestWithUser } from '../models/types';


export default class LogoutRoute extends Route {
  constructor(mm: ModmailServer) {
    const router = Router();
    super(mm, 'logout', router);
  }

  public getRouter(): Router {
    this.router.post('/', LogoutRoute.root.bind(this));

    return this.router;
  }

  private static async root(req: RequestWithUser, res: Response) {
    // TODO: Add proper logger
    req.session.destroy(console.error);
    res.status(200);
    res.end();
  }
}
