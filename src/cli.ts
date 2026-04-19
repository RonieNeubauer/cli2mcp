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

function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

export function parseArgs(argv: string[]): Options {
  const program = new Command();

  program
    .exitOverride()
    .name("mcp-wrap")
    .argument("<command>", "CLI binary to wrap (must be on $PATH)")
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

  const cmd = program.args[0] as string;
  const opts = program.opts<Omit<Options, "command">>();

  return {
    command: cmd,
    name: opts.name ?? cmd,
    description: opts.description,
    timeout: opts.timeout,
    cwd: opts.cwd,
    env: opts.env,
    stderr: opts.stderr,
  };
}
