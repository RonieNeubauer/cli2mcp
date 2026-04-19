import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, test } from "vitest";
import type { Options } from "../src/cli.js";
import type { CliShape } from "../src/parser/shape.js";
import { createMcpServer } from "../src/server.js";

const nodeEcho: CliShape = {
  description: "echo tool",
  flags: [
    { long: "upper", type: "boolean", description: "uppercase output", repeatable: false },
    { long: "prefix", type: "string", description: "prefix string", repeatable: false },
  ],
  positionals: [{ name: "args", description: "", variadic: true }],
};

// A tiny Node script that mimics a CLI: reads --upper/--prefix and positional args,
// prints "<prefix><rest>" possibly uppercased, exits 1 on --fail.
const ECHO_SCRIPT = `
const args = process.argv.slice(1);
let upper = false; let prefix = ""; let fail = false; const rest = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--upper") upper = true;
  else if (a === "--prefix") { prefix = args[++i] ?? ""; }
  else if (a === "--fail") fail = true;
  else rest.push(a);
}
if (fail) { process.stderr.write("boom"); process.exit(1); }
let out = prefix + rest.join(" ");
if (upper) out = out.toUpperCase();
process.stdout.write(out);
`;

const baseOptions: Options = {
  command: "node",
  name: "echo",
  description: "echo tool",
  timeout: 5000,
  cwd: process.cwd(),
  env: [],
  stderr: "include",
};

async function connect(shape: CliShape, opts: Options = baseOptions) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = await createMcpServer({
    cmd: "node",
    preArgs: ["-e", ECHO_SCRIPT, "--"],
    shape,
    options: opts,
  });
  const client = new Client({ name: "test-client", version: "0.0.0" }, { capabilities: {} });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return { server, client };
}

describe("createMcpServer", () => {
  const cleanup: Array<() => Promise<void>> = [];
  afterEach(async () => {
    await Promise.all(cleanup.splice(0).map((fn) => fn()));
  });

  test("tools/list returns one tool built from shape + options", async () => {
    const { server, client } = await connect(nodeEcho);
    cleanup.push(
      () => client.close(),
      () => server.close(),
    );

    const result = await client.listTools();
    expect(result.tools).toHaveLength(1);
    const [tool] = result.tools;
    expect(tool.name).toBe("echo");
    expect(tool.description).toBe("echo tool");
    expect(tool.inputSchema.type).toBe("object");
    expect(tool.inputSchema.properties).toHaveProperty("upper");
    expect(tool.inputSchema.properties).toHaveProperty("prefix");
    expect(tool.inputSchema.properties).toHaveProperty("args");
  });

  test("tools/call spawns the child with built argv and returns stdout", async () => {
    const { server, client } = await connect(nodeEcho);
    cleanup.push(
      () => client.close(),
      () => server.close(),
    );

    const result = await client.callTool({
      name: "echo",
      arguments: { prefix: ">> ", args: ["hello", "world"] },
    });
    expect(result.isError).not.toBe(true);
    expect(result.content).toEqual([{ type: "text", text: ">> hello world" }]);
  });

  test("boolean flag true maps to --flag in child argv", async () => {
    const { server, client } = await connect(nodeEcho);
    cleanup.push(
      () => client.close(),
      () => server.close(),
    );

    const result = await client.callTool({
      name: "echo",
      arguments: { upper: true, args: ["hi"] },
    });
    expect(result.content).toEqual([{ type: "text", text: "HI" }]);
  });

  test("non-zero exit surfaces as a tool error containing stderr", async () => {
    const shape: CliShape = {
      description: "",
      flags: [{ long: "fail", type: "boolean", description: "", repeatable: false }],
      positionals: [],
    };
    const { server, client } = await connect(shape);
    cleanup.push(
      () => client.close(),
      () => server.close(),
    );

    const result = await client.callTool({ name: "echo", arguments: { fail: true } });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]?.text ?? "";
    expect(text).toContain("boom");
  });

  test("stderr=drop suppresses stderr content on non-zero exit", async () => {
    const shape: CliShape = {
      description: "",
      flags: [{ long: "fail", type: "boolean", description: "", repeatable: false }],
      positionals: [],
    };
    const { server, client } = await connect(shape, { ...baseOptions, stderr: "drop" });
    cleanup.push(
      () => client.close(),
      () => server.close(),
    );

    const result = await client.callTool({ name: "echo", arguments: { fail: true } });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]?.text ?? "";
    expect(text).not.toContain("boom");
  });
});
