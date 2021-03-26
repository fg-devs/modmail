import Route from '../route';
import ModmailServer from '../../server';
import { Response, Router } from 'express';
import { RequestWithCategory } from '../../models/types';
import { ChannelState } from '@newcircuit/modmail-types';

export default class ChannelsRoute extends Route {
  constructor(mm: ModmailServer) {
    const router = Router();
    super(mm, 'channels', router);
  }

  /**
   * For getting data on a certain channel on Discord
   * GET /api/categories/:categoryID/channels/:channelID
   * @param  {RequestWithCategory} req
   * @param  {Response} res
   * @return {Promise<void>}
   */
  public async getChannel(
    req: RequestWithCategory,
    res: Response,
  ): Promise<void> {
    const { channelID } = req.params;
    const bot = this.modmail.getBot();
    const channel = await bot.getChannel(channelID);

    await this.sendState<ChannelState>(res, channel);
  }
}
