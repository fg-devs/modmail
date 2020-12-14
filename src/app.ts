import Modmail from './Modmail';

async function main() {
  const app = new Modmail();

  await app.start();
}

main().catch(console.error);
