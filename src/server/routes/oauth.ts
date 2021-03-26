import {
  Router,
  Response,
} from 'express';
import got from 'got/dist/source';
import {
  Guild,
  RequestWithRedirect,
  RequestWithUser,
  User
} from '../models/types';
import ModmailServer from '../server';
import Route from './route';

export interface OAuthData {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export default class OAuthRoute extends Route {
  constructor(mm: ModmailServer) {
    const router = Router();
    super(mm, 'oauth', router);
  }

  public getRouter(): Router {
    this.router.get('/api/oauth', this.oauth.bind(this));
    this.router.get('/api/oauth/callback', this.callback.bind(this));

    return this.router;
  }

  /**
   * For redirecting the user to Discord's OAuth login page
   * GET /api/oauth
   * @param  {RequestWithRedirect} req
   * @param  {Response} res
   * @return {Promise<void>}
   */
  private async oauth(
    req: RequestWithRedirect,
    res: Response,
  ): Promise<void> {
    const client = this.modmail.getOAuth();
    const redirection = client.code.getUri();
    const { redirect } = req.query;

    if (typeof redirect === 'string') {
      req.session.redirect = decodeURI(redirect);
      req.session.save();
    }

    res.redirect(redirection);
  }

  /**
   * Discord will redirect the user to this endpoint when they've logged in
   * GET /api/oauth/callback
   * @param  {RequestWithUser} req
   * @param  {Response} res
   * @return {Promise<void>}
   */
  private async callback(
    req: RequestWithUser,
    res: Response,
  ): Promise<void> {
    const logger = this.getLogger();
    const { code } = req.query;
    const { redirect } = req.session;

    if (!code) {
      res.status(400);
      res.end();
      return;
    }

    try {
      const client = this.modmail.getOAuth();
      const user = await client.code.getToken(req.url);
      const userRes = await got(
        'https://discord.com/api/v8/users/@me',
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        },
      );
      // TODO: add caching
      const guildRes = await got(
        'https://discord.com/api/v8/users/@me/guilds',
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          }
        }
      );
      const guildData: Guild[] = JSON.parse(guildRes.body);
      const userData: User = JSON.parse(userRes.body);

      req.session.guildIDs = guildData.map((guild) => guild.id);
      req.session.user = {
        ...userData,
        token: user.accessToken,
      };
      req.session.save((e: Error) => logger.error(e));

      // redirect to original origin
      const redirection = redirect !== undefined
        ? redirect
        : '/';

      res.redirect(redirection);
      delete req.session.redirect;
      req.session.save(console.error);
    } catch (e) {
      this.failError(res, e);
    } finally {
      res.end();
    }
  }
}
