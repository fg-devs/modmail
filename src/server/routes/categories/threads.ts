import { Response, Router } from 'express';
import { Thread } from '@prisma/client';
import { RequestWithCategory } from '../../types';
import ModmailServer, { ThreadWithMessages } from '../..';
import Route from '../../route';

export default class ThreadsRoute extends Route {
  constructor(mm: ModmailServer) {
    const router = Router();
    super(mm, 'threads', router);
  }

  /**
   * GET /api/categories/:categoryID/threads/:threadID
   * @param {RequestWithUser} req
   * @param {Response} res
   * @returns {Promise<void>}
   */
  public async getThread(
    req: RequestWithCategory,
    res: Response,
  ): Promise<void> {
    const { category } = req.session;
    const { member } = req.session;
    const { threadID } = req.params;
    if (member === undefined || category === undefined || category === null) {
      res.status(401);
      res.end();
      return;
    }

    const db = this.modmail.getDB();
    const partialThread = await db.threads.getById(threadID);

    if (partialThread === null) {
      res.status(404);
      res.end();
      return;
    }

    if (partialThread.isAdminOnly && member.role !== 'admin') {
      this.failBadReq(res, 'Not an admin');
      return;
    }

    const thread = {
      ...partialThread,
      messages: await db.messages.fetchAll(threadID),
    };

    // get user cache
    const targets = new Set<string>();

    for (let i = 0; i < thread.messages.length; i += 1) {
      const msg = thread.messages[i];

      targets.add(msg.senderId);
    }

    const users = await this.modmail.getUserCache(targets.values());

    res.json({
      ...thread,
      users,
    });
    res.end();
  }

  /**
   * GET /api/categories/:categoryID/threads
   * @param {RequestWithUser} req
   * @param {Response} res
   * @returns {Promise<void>}
   */
  public async getThreads(
    req: RequestWithCategory,
    res: Response,
  ): Promise<void> {
    const { category } = req.session;
    const { member } = req.session;
    if (category === undefined || member === undefined) {
      res.status(401);
      res.end();
      return;
    }

    const db = this.modmail.getDB();

    let threadsOpt = await db.threads.getByCategory(category.id);
    threadsOpt = threadsOpt.filter((thr: Thread) => (thr.isAdminOnly && member.role === 'admin')
        || (!thr.isAdminOnly));
    let threads: ThreadWithMessages[] = threadsOpt.map<ThreadWithMessages>((th) => ({
      ...th,
      messages: [],
    }));
    threads = await this.modmail.getLastMessages(threads);
    const targets = new Set<string>();

    // get user cache
    for (let i = 0; i < threads.length; i += 1) {
      const thread = threads[i];
      targets.add(thread.authorId);

      // get last message author
      if (thread.messages.length > 0) {
        const message = thread.messages[0];
        targets.add(message.senderId);
      }
    }

    const users = await this.modmail.getUserCache(targets.values());

    res.json({
      threads,
      users,
    });
    res.end();
  }
}
