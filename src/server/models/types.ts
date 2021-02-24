import { Snowflake } from 'discord.js';
import { Request } from 'express';
import { Session } from 'express-session';
import { Category, RoleLevel } from '@Floor-Gang/modmail-types';

export type User = {
  avatar: string;
  bot: boolean;
  discriminator: string;
  id: Snowflake;
  username: string;
  token: string;
}

export interface Member extends User {
  role: RoleLevel;
}

export type Guild = {
  id: string;
  name: string;
  icon: string;
  owner: boolean;
  permissions: string;
  features: string[];
}

export interface RedirSession extends Session {
  redirect?: string;
}

export interface UserSession extends RedirSession {
  user?: User;
  guildIDs?: string[];
}

export interface CategorySession extends UserSession {
  category?: Category;
  member?: Member,
}

export interface RequestWithRedirect<a = any, b = any, c = any, d = any> extends Request<a, b, c, d> {
  session: RedirSession;
}

export interface RequestWithUser<a = any, b = any, c = any, d = any> extends Request<a, b, c, d> {
  session: UserSession;
}

export interface RequestWithCategory<a = any, b = any, c = any, d = any> extends Request<a, b, c, d> {
  session: CategorySession;
}
