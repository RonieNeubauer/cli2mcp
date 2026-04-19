import { parseArgs } from "./cli.js";
import { killActiveChildren, startServer } from "./server.js";

async function main(): Promise<void> {
  const options = parseArgs(process.argv);
  const server = await startServer(options);

  let shuttingDown = false;
  const shutdown = async (): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    try {
      await killActiveChildren();
      await server.close();
    } finally {
      process.exit(0);
    }
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`mcp-wrap: ${message}\n`);
  process.exit(1);
});
