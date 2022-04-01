import { Response, Router } from 'express';
import { RoleState } from '@newcircuit/modmail-types';
import Route from '../../route';
import ModmailServer from '../..';
import { RequestWithCategory } from '../../types';

export default class RolesRoute extends Route {
  constructor(mm: ModmailServer) {
    const router = Router();
    super(mm, 'roles', router);
  }

  public getRouter(): Router {
    return super.getRouter();
  }

  /**
   * For getting roles of a Discord guild
   * GET /api/categories/:categoryID/roles
   * @param  {RequestWithCategory} req
   * @param  {Response} res
   * @return {Promise<void>}
   */
  public async getRole(
    req: RequestWithCategory,
    res: Response,
  ): Promise<void> {
    const { roleID } = req.params;
    const bot = this.modmail.getBot();
    const role = await bot.getRole(roleID);

    await this.sendState<RoleState>(res, role);
  }
}
