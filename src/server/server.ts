import ClientOAuth2 from 'client-oauth2';
import express, {
  Application,
  NextFunction,
  Response,
} from 'express';
import OAuthRoute from './routes/oauth';
import { CONFIG } from '../common/globals';
import session from 'express-session';
import SelfRoute from './routes/self';
import CategoriesRoute from './routes/categories';
import { DatabaseManager } from './../database';
import { RequestWithUser } from './models/types';
import BotController from './controllers/bot';
import { getLogger, Logger } from 'log4js';
import {
  Message,
  Thread,
  UserState,
  UserStateCache,
} from '@newcircuit/modmail-types';
import LogoutRoute from './routes/logout';

export default class ModmailServer {
  private readonly bot: BotController;

  private readonly app: Application;

  private readonly oauth: ClientOAuth2;

  private static db: DatabaseManager;

  constructor(botLocation: string) {
    this.app = express();
    this.bot = new BotController(this, botLocation);
    this.oauth = new ClientOAuth2(CONFIG.server.oauth2);
    ModmailServer.db = new DatabaseManager(CONFIG.database);
  }

  /**
   * This method must be called before all else can happen
   */
  public async start() {
    const oauth = new OAuthRoute(this);
    const categories = new CategoriesRoute(this);
    const self = new SelfRoute(this);
    const logout = new LogoutRoute(this);
    const logger = this.getLogger('start');

    this.app.use(session({
      secret: CONFIG.server.appkey,
      cookie: {
        secure: false,
      },
    }));
    this.app.use('/', oauth.getRouter());

    this.app.use('/api/logout', logout.getRouter());
    this.app.use('/api/self', this.authenticate.bind(this));
    this.app.use('/api/self', self.getRouter());

    this.app.use('/api/categories', this.authenticate.bind(this));
    this.app.use('/api/categories', categories.getRouter());

    this.app.listen(
      CONFIG.server.port,
      () => logger.info(
        `Server is ready. Listening on port ${CONFIG.server.port}`,
      ),
    );
  }

  public authenticate(
    req: RequestWithUser,
    res: Response,
    next: NextFunction,
  ) {
    const { user } = req.session;

    if (user === undefined) {
      res.status(401);
      res.end();
      return;
    }
    next();
  }

  public getOAuth(): ClientOAuth2 {
    return this.oauth;
  }

  public getDB(): DatabaseManager {
    if (ModmailServer.db !== null) {
      return ModmailServer.db;
    }
    throw new Error('getDB was called before starting ModmailServer');
  }

  public getLogger(section: string): Logger {
    const logger = getLogger(`ModmailServer::${section}`);
    logger.level = CONFIG.logLevel;
    return logger;
  }

  public async getUserCache(targets: Iterator<string>): Promise<UserStateCache> {
    const bot = this.getBot();
    const usrTasks: Promise<UserState | null>[] = [];

    let userID = targets.next();
    while (!userID.done) {
      const task = bot.getUser(userID.value, true);
      usrTasks.push(task);
      userID = targets.next();
    }

    const users = await Promise.all(usrTasks);
    let res: UserStateCache = {};

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      if (user !== null) {
        res[user.id] = user;
      }
    }

    return res;
  }

  public async getLastMessages(threads: Thread[]): Promise<Thread[]> {
    const msgTasks: Promise<Message | null>[] = [];
    const pool = this.getDB();

    for (let i = 0; i < threads.length; i++) {
      const thread = threads[i];
      const task = pool.messages.fetchLast(thread.id);
      msgTasks.push(task);
    }

    const msgs = await Promise.all(msgTasks);

    for (let i = 0; i < threads.length; i++) {
      const msg = msgs[i];
      if (msg !== null) {
        threads[i].messages.push(msg);
      }
    }

    return threads;
  }

  public getBot(): BotController {
    return this.bot;
  }
}
