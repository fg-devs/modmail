import { Response, Router } from 'express';
import ModmailServer from '../controllers/server';

export default class Route {
  protected readonly name: string;

  protected readonly modmail: ModmailServer;

  protected readonly router: Router;

  constructor(mm: ModmailServer, name: string, router: Router) {
    this.name = name;
    this.modmail = mm;
    this.router = router;
  }

  public getRouter(): Router {
    return this.router;
  }

  protected async sendState<T>(
    res: Response,
    data: T | null,
  ): Promise<void> {
    if (data === null) {
      res.status(204);
      res.end();
      return;
    }

    res.json(data);
    res.end();
  }

  protected failBadReq(res: Response, context?: string) {
    if (context) {
      // TODO: Added proper logger
      console.warn(context);
    }
    res.status(400);
    res.end();
  }

  protected failUnknown(res: Response) {
    // TODO: Add proper logger
    console.error('How did we get here?');
    res.status(500);
    res.end();
  }

  protected failError(res: Response, err: Error) {
    // TODO: Add proper logger
    console.error(err);
    res.status(500);
    res.end();
  }
}
