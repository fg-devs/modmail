import ModmailServer from '../server';
import MembersRoute from './categories/members';
import UsersRoute from './categories/users';
import ThreadsRoute from './categories/threads';
import { RequestWithCategory, RequestWithUser } from '../models/types';
import { Category, RoleLevel } from '@Floor-Gang/modmail-types';
import Route from './route';
import { NextFunction, Response, Router, } from 'express';
import RolesRoute from './categories/roles';
import ChannelsRoute from './categories/channels';

export default class CategoriesRoute extends Route {
  constructor(mm: ModmailServer) {
    const router = Router();
    super(mm, 'categories', router);
  }

  public getRouter(): Router {
    const members = new MembersRoute(this.modmail);
    const threads = new ThreadsRoute(this.modmail);
    const roles = new RolesRoute(this.modmail);
    const channels = new ChannelsRoute(this.modmail);
    const users = new UsersRoute(this.modmail);

    this.router.get('/', this.getCategories.bind(this));
    this.router.use('/:categoryID', this.authenticate.bind(this));
    this.router.get('/:categoryID', this.getCategory.bind(this));

    // Thread Endpoints
    this.router.get('/:categoryID/threads', threads.getThreads.bind(threads));
    this.router.get('/:categoryID/threads/:threadID', threads.getThread.bind(threads));

    // Member & User states
    this.router.get('/:categoryID/members', members.getMembers.bind(members));
    this.router.get('/:categoryID/users/:userID', users.getUser.bind(users));
    this.router.get(
      '/:categoryID/users/:userID/history',
      users.getHistory.bind(users),
    );

    // Channel states
    this.router.get(
      '/:categoryID/channels/:channelID',
      channels.getChannel.bind(channels),
    );

    // Role states
    this.router.get(
      '/:categoryID/roles/:roleID',
      roles.getRole.bind(roles),
    );
    return this.router;
  }

  private async authenticate(
    req: RequestWithCategory,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    if (req.session.user === undefined) {
      this.failUnknown(res);
      return;
    }

    const { categoryID } = req.params;
    const { user } = req.session;
    const bot = this.modmail.getBot();
    const pool = this.modmail.getDB();
    const cat = await pool.categories.fetchByID(categoryID);

    if (cat === null) {
      this.failBadReq(res, 'This category ID doesn\'t exist');
      return;
    }

    const member = await bot.getMember(
      cat.guildID,
      req.session.user.id,
    );

    if (member.role !== 'mod' && member.role !== 'admin') {
      res.status(403);
      res.end();
      return;
    }


    req.session.member = {
      ...user,
      role: member.role === 'mod' ? RoleLevel.Mod : RoleLevel.Admin,
    };
    req.session.category = cat;
    next();
  }

  /**
   * GET /categories -> Category[]
   * @param {RequestWithUser} req
   * @param {Response} res
   * @returns {Promise<void>}
   */
  private async getCategories(
    req: RequestWithUser,
    res: Response,
  ): Promise<void> {
    const { guildIDs } = req.session;

    if (guildIDs === undefined) {
      this.failUnknown(res);
      return;
    }

    const db = this.modmail.getDB();
    const fetchTasks: Promise<Category | null>[] = [];

    for (let i = 0; i < guildIDs.length; i++) {
      const guildID = guildIDs[i];
      const fetchTask = db.categories.fetchByGuild(guildID);
      fetchTasks.push(fetchTask);
    }

    const categories = await Promise.all(fetchTasks);
    const resData: Category[] = [];
    categories.forEach((data) => {
      if (data !== null) {
        resData.push(data);
      }
    });

    res.json(resData);
    res.end();
  }

  /**
   * GET /categories/:categoryID -> Category
   * @param {RequestWithUser} req
   * @param {Response} res
   * @returns {Promise<void>}
   */
  private async getCategory(
    req: RequestWithUser,
    res: Response,
  ): Promise<void> {
    const { categoryID } = req.params;

    const db = this.modmail.getDB();
    const category = await db.categories.fetchByID(categoryID);

    if (category === null) {
      this.failBadReq(res, `The category ID "${categoryID}" doesn't exist.`);
      return;
    }

    res.json(category);
    res.end();
  }
}
