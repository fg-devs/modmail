import ModmailServer from './server/server';
import location from './bot/start';

async function main() {
  const server = new ModmailServer(location);
  await server.start();
}

main().catch(console.error);
