import { ModmailServer } from './server';
import location from './bot/start';
import BotCtrl from './server/controllers/bot';

async function main() {
  const botCtl = new BotCtrl(location);
  const server = new ModmailServer(botCtl);
  await server.start();
}

main().catch(console.error);
