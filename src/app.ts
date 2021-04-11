import {
  isMainThread,
  Worker,
} from 'worker_threads';
import ModmailServer from './server';
import ModmailBot from './bot';

async function main() {
  if (isMainThread) {
    await startServer();
  } else {
    await startBot();
  }
}

/**
 * This is called when the worker thread spawns
 */
async function startBot() {
  const bot = new ModmailBot();
  await bot.start();
}

/**
 * The bot runs in a worker thread that's managed by the bot
 */
async function startServer() {
  const bot = new Worker(__filename);
  const server = new ModmailServer(bot);
  await server.start();
}

main().catch(console.error);
