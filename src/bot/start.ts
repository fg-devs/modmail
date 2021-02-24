import * as worker_threads from 'worker_threads';
import ModmailBot from './controllers/bot';

if (!worker_threads.isMainThread) {
  const bot = new ModmailBot();
  bot.start().catch(console.error);
}

export default __filename
