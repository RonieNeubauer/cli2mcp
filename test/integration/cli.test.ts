import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { execa } from "execa";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const distEntry = path.resolve(projectRoot, "dist/index.js");

const BUILD_TIMEOUT = 60_000;

describe("mcp-wrap end-to-end (spawned as child process)", () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    await execa("pnpm", ["build"], { cwd: projectRoot, timeout: BUILD_TIMEOUT });
    transport = new StdioClientTransport({
      command: process.execPath,
      args: [distEntry, "node", "--name", "node", "--timeout", "10000"],
      stderr: "pipe",
    });
    client = new Client({ name: "it-client", version: "0.0.0" }, { capabilities: {} });
    await client.connect(transport);
  }, BUILD_TIMEOUT);

  afterAll(async () => {
    await client?.close();
    await transport?.close();
  });

  test("initialize handshake completes and server info is populated", () => {
    const serverInfo = client.getServerVersion();
    expect(serverInfo?.name).toBe("mcp-wrap");
  });

  test("tools/list returns the wrapped CLI as a single tool", async () => {
    const result = await client.listTools();
    expect(result.tools).toHaveLength(1);
    const [tool] = result.tools;
    expect(tool?.name).toBe("node");
    expect(tool?.inputSchema?.type).toBe("object");
  });

  test("tools/call runs the wrapped CLI and returns its stdout", async () => {
    const result = await client.callTool({
      name: "node",
      arguments: { args: ["--version"] },
    });
    expect(result.isError).not.toBe(true);
    const blocks = result.content as Array<{ type: string; text: string }>;
    expect(blocks[0]?.type).toBe("text");
    expect(blocks[0]?.text ?? "").toMatch(/^v\d+\.\d+\.\d+/);
  });
});
