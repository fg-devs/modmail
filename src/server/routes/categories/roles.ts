import Route from '../route';
import ModmailServer from '../../server';
import { Response, Router } from 'express';
import { RequestWithCategory } from '../../models/types';
import { RoleState } from '@Floor-Gang/modmail-types';

export default class RolesRoute extends Route {
  constructor(mm: ModmailServer) {
    const router = Router();
    super(mm, 'roles', router);
  }

  public getRouter(): Router {
    return super.getRouter();
  }

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
