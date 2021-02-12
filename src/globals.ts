import Config from './config/config';

export const CONFIG = Config.getConfig();

export const PROMPT_TIME = 30000;

export const CLOSE_THREAD_DELAY = 10000;

export const IMAGE_REGEX = /\.|jpe?g|tiff?|png|webp|bmp$/i;

export const MAX_THREADS = 30;

export const COLORS = {
  SEND: 0x7CFC00,
  RECEIVE: 0xE8D90C,
  INTERNAL: 0xADD8E6,
};
