import ModmailServer from './server/server';
import location from './bot/start';
import ModmailBot from './server/controllers/bot';

async function main() {
  const botCtl = new ModmailBot(location);
  const server = new ModmailServer(botCtl);
  await server.start();
}

main().catch(console.error);
