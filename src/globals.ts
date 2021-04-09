import Config from './config/config';

export const ADMIN_INDICATOR_PREFIX = '⭐┃';

export const CONFIG = Config.getConfig();

export const COLORS = {
  SEND: 0x505DF4,
  RECEIVE: 0xfed69a,
  INTERNAL: 0xADD8E6,
  BAD: 'RED',
  WARNING: 'YELLOW',
};

export const CLOSE_THREAD_DELAY = 10000;

export const IMAGE_REGEX = /\.|jpe?g|tiff?|png|gif|webp|bmp$/i;

export const PROMPT_TIME = 30000;

export const MAX_LISTENERS = 1000;

export const MAX_RESPONSE_TIME = 60000;

export const MAX_THREADS = 30;
