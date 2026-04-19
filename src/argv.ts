import type { CliShape, FlagSpec } from "./parser/shape.js";

export type ToolInput = Record<string, unknown>;

export function buildArgv(shape: CliShape, input: ToolInput): string[] {
  const argv: string[] = [];
  const flagByName = new Map<string, FlagSpec>();
  for (const f of shape.flags) flagByName.set(f.long, f);

  for (const [key, value] of Object.entries(input)) {
    if (key === "args") continue;
    const flag = flagByName.get(key);
    if (!flag) continue;
    appendFlag(argv, flag, value);
  }

  const positionals = input.args;
  if (Array.isArray(positionals)) {
    for (const p of positionals) argv.push(String(p));
  }

  return argv;
}

function appendFlag(argv: string[], flag: FlagSpec, value: unknown): void {
  if (flag.repeatable && Array.isArray(value)) {
    for (const v of value) {
      argv.push(`--${flag.long}`, String(v));
    }
    return;
  }

  if (flag.type === "boolean") {
    if (value === true) argv.push(`--${flag.long}`);
    return;
  }

  if (value === undefined || value === null) return;
  argv.push(`--${flag.long}`, String(value));
}
