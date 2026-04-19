import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { execa, type ResultPromise } from "execa";
import { buildArgv, type ToolInput } from "./argv.js";
import type { Options } from "./cli.js";
import { type CliShape, extractShape } from "./parser/shape.js";
import { captureHelp } from "./parser/spawn.js";
import { toInputSchema } from "./schema.js";

export interface CreateServerParams {
  cmd: string;
  shape: CliShape;
  options: Options;
  /** Extra args prepended before the built argv — used by tests to inject `-e <script> --`. */
  preArgs?: string[];
}

const PKG_NAME = "mcp-wrap";
const PKG_VERSION = "0.0.0";

export async function createMcpServer(params: CreateServerParams): Promise<Server> {
  const { cmd, shape, options, preArgs = [] } = params;

  const server = new Server(
    { name: PKG_NAME, version: PKG_VERSION },
    { capabilities: { tools: {} } },
  );

  const inputSchema = toInputSchema(shape);
  const description = options.description ?? shape.description ?? "";
  const envOverrides = parseEnvPairs(options.env);

  const tool = {
    name: options.name,
    description,
    inputSchema: inputSchema as unknown as {
      type: "object";
      properties?: Record<string, unknown>;
    },
  };

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [tool] }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name !== options.name) {
      return {
        isError: true,
        content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }],
      };
    }

    const input = (request.params.arguments ?? {}) as ToolInput;
    const argv = [...preArgs, ...buildArgv(shape, input)];
    const result = await runChild(cmd, argv, options, envOverrides);

    if (result.exitCode !== 0) {
      return {
        isError: true,
        content: [{ type: "text", text: errorText(result, options.stderr) }],
      };
    }

    const text =
      options.stderr === "include" && result.stderr
        ? `${result.stdout}${result.stdout && result.stderr ? "\n" : ""}${result.stderr}`
        : result.stdout;

    return { content: [{ type: "text", text }] };
  });

  return server;
}

export async function startServer(options: Options): Promise<Server> {
  const helpText = await captureHelp(options.command);
  const shape = extractShape(helpText);
  const server = await createMcpServer({ cmd: options.command, shape, options });
  const transport = new StdioServerTransport();
  await server.connect(transport);
  return server;
}

interface ChildResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

async function runChild(
  cmd: string,
  argv: string[],
  options: Options,
  envOverrides: Record<string, string>,
): Promise<ChildResult> {
  const child: ResultPromise = execa(cmd, argv, {
    timeout: options.timeout,
    cwd: options.cwd,
    env: { ...process.env, ...envOverrides },
    reject: false,
    stripFinalNewline: false,
  });

  const result = await child;
  return {
    stdout: typeof result.stdout === "string" ? result.stdout : "",
    stderr: typeof result.stderr === "string" ? result.stderr : "",
    exitCode: typeof result.exitCode === "number" ? result.exitCode : 1,
  };
}

function errorText(result: ChildResult, mode: Options["stderr"]): string {
  const head = `Command failed (exit ${result.exitCode})`;
  if (mode === "drop") return head;
  const tail = result.stderr.trim() || result.stdout.trim();
  return tail ? `${head}: ${tail}` : head;
}

function parseEnvPairs(pairs: string[]): Record<string, string> {
  const env: Record<string, string> = {};
  for (const pair of pairs) {
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    const key = pair.slice(0, eq);
    const value = pair.slice(eq + 1);
    env[key] = value;
  }
  return env;
}
