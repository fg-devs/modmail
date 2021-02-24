import Route from '../../models/route';
import ModmailServer from '../../server';
import { Response, Router } from 'express';
import { RequestWithCategory } from '../../models/types';
import { ChannelState } from '@Floor-Gang/modmail-types';

export default class ChannelsRoute extends Route {
  constructor(mm: ModmailServer) {
    const router = Router();
    super(mm, 'channels', router);
  }

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
