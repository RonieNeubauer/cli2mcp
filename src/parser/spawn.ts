import { execa } from "execa";

export class NoHelpError extends Error {
  constructor(public readonly cmd: string) {
    super(`Failed to capture --help output for "${cmd}": command produced no output`);
    this.name = "NoHelpError";
  }
}

export async function captureHelp(cmd: string): Promise<string> {
  const result = await execa(cmd, ["--help"], {
    timeout: 5000,
    reject: false,
  });

  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";

  if (result.exitCode !== 0 && stdout.length === 0 && stderr.length === 0) {
    throw new NoHelpError(cmd);
  }

  return `${stdout}\n${stderr}`;
}
