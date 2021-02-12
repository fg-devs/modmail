import Config from './config/config';

export const CONFIG = Config.getConfig();

export const PROMPT_TIME = 30000;

export const CLOSE_THREAD_DELAY = 10000;

export const IMAGE_REGEX = /\.|jpe?g|tiff?|png|webp|bmp$/i;

export const MAX_THREADS = 30;

export const COLORS = {
  SEND: 0x505DF4,
  RECEIVE: 0xfed69a,
  INTERNAL: 0xADD8E6,
  BAD: 'RED',
};
