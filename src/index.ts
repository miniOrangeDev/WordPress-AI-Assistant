import 'dotenv/config';
import { WordPressMCPServer } from './server.js';

async function main(): Promise<void> {
  const server = new WordPressMCPServer();
  await server.initialize();
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start WordPress MCP Server:', error);
  process.exitCode = 1;
});


