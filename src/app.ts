import { ModmailServer } from './server';
import { ModmailBot } from './bot';
import BotCtrl from './server/controllers/bot';

async function main() {
  const location = ModmailBot.getLocation();
  const botCtl = new BotCtrl(location);
  const server = new ModmailServer(botCtl);
  await server.start();
}

main().catch(console.error);
