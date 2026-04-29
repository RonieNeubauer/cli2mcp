import { Command, InvalidArgumentError } from "commander";

export interface Options {
  command: string;
  name: string;
  description?: string;
  timeout: number;
  cwd: string;
  env: string[];
  stderr: "include" | "drop" | "error";
}

const STDERR_MODES = ["include", "drop", "error"] as const;
const COMMAND_ENV_KEYS = ["CLI_COMMAND", "CLI2MCP_COMMAND"] as const;

interface TtyState {
  stdin: boolean;
  stdout: boolean;
  stderr: boolean;
}

function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

function readCommandFromEnv(env: NodeJS.ProcessEnv): string | undefined {
  for (const key of COMMAND_ENV_KEYS) {
    const value = env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

/**
 * Resolve the wrapped command from:
 * 1) positional argument,
 * 2) supported environment variables,
 * 3) non-interactive fallback ("node") for managed runtimes.
 */
export function resolveCommand(
  commandArg: string | undefined,
  env: NodeJS.ProcessEnv = process.env,
  ttyState: TtyState = {
    stdin: Boolean(process.stdin.isTTY),
    stdout: Boolean(process.stdout.isTTY),
    stderr: Boolean(process.stderr.isTTY),
  },
): string {
  const fromArg = commandArg?.trim();
  if (fromArg) return fromArg;

  const fromEnv = readCommandFromEnv(env);
  if (fromEnv) return fromEnv;

  const isInteractiveSession = ttyState.stdin && ttyState.stdout && ttyState.stderr;
  if (!isInteractiveSession) return "node";

  throw new Error(
    "missing required argument 'command'. Pass <command> or set CLI_COMMAND in the environment.",
  );
}

function defaultDescriptionFor(
  command: string,
  inferredFromPositionalArg: boolean,
): string | undefined {
  if (inferredFromPositionalArg) return undefined;
  return (
    `Execute ${command} as an MCP tool. Use this for command-line operations that map ` +
    `cleanly to flags and positional args. Output is returned as plain text and non-zero exits ` +
    `are surfaced as tool errors.`
  );
}

export function parseArgs(argv: string[]): Options {
  const program = new Command();

  program
    .exitOverride()
    .name("cli2mcp")
    .argument("[command]", "CLI binary to wrap (must be on $PATH)")
    .option("--name <s>", "tool name exposed via MCP")
    .option("--description <s>", "tool description")
    .option(
      "--timeout <ms>",
      "per-invocation timeout in ms",
      (v) => {
        const n = Number(v);
        if (Number.isNaN(n)) throw new InvalidArgumentError("must be a number");
        return n;
      },
      60000,
    )
    .option("--cwd <path>", "working directory for child", process.cwd())
    .option("--env <k=v>", "additional env vars (repeatable)", collect, [] as string[])
    .option(
      "--stderr <mode>",
      "include | drop | error",
      (v) => {
        if (!(STDERR_MODES as readonly string[]).includes(v)) {
          throw new InvalidArgumentError(`must be one of: ${STDERR_MODES.join(", ")}`);
        }
        return v as Options["stderr"];
      },
      "include" as Options["stderr"],
    );

  program.parse(argv);

  const positionalCommand = typeof program.args[0] === "string" ? program.args[0] : undefined;
  const cmd = resolveCommand(positionalCommand);
  const opts = program.opts<Omit<Options, "command">>();
  const inferredFromPositionalArg = Boolean(positionalCommand?.trim());

  return {
    command: cmd,
    name: opts.name ?? cmd,
    description: opts.description ?? defaultDescriptionFor(cmd, inferredFromPositionalArg),
    timeout: opts.timeout,
    cwd: opts.cwd,
    env: opts.env,
    stderr: opts.stderr,
  };
}
