import { Response, Router } from 'express';
import { Logger } from 'log4js';
import ModmailServer from '../server';

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
    const logger = this.getLogger();
    if (context) {
      // TODO: Added proper logger
      logger.warn(context);
    }
    res.status(400);
    res.end();
  }

  protected getLogger(): Logger {
    return this.modmail.getLogger(this.name);
  }

  protected failUnknown(res: Response) {
    const logger = this.getLogger();
    logger.error('How did we get here?');
    res.status(500);
    res.end();
  }

  protected failError(res: Response, err: Error) {
    const logger = this.getLogger();
    logger.error(err);
    res.status(500);
    res.end();
  }
}
