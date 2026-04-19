import { describe, expect, test } from "vitest";
import { parseArgs } from "../src/cli.js";

describe("parseArgs", () => {
  test("parses positional command", () => {
    const opts = parseArgs(["node", "cli2mcp", "jq"]);
    expect(opts.command).toBe("jq");
  });

  test("defaults: name=command, timeout=60000, stderr=include", () => {
    const opts = parseArgs(["node", "cli2mcp", "jq"]);
    expect(opts.name).toBe("jq");
    expect(opts.timeout).toBe(60000);
    expect(opts.stderr).toBe("include");
    expect(opts.env).toEqual([]);
  });

  test("--name overrides tool name", () => {
    const opts = parseArgs(["node", "cli2mcp", "jq", "--name", "json-query"]);
    expect(opts.name).toBe("json-query");
  });

  test("--description sets description", () => {
    const opts = parseArgs(["node", "cli2mcp", "jq", "--description", "JSON processor"]);
    expect(opts.description).toBe("JSON processor");
  });

  test("--timeout parses as number", () => {
    const opts = parseArgs(["node", "cli2mcp", "jq", "--timeout", "30000"]);
    expect(opts.timeout).toBe(30000);
  });

  test("--cwd sets working directory", () => {
    const opts = parseArgs(["node", "cli2mcp", "jq", "--cwd", "/tmp"]);
    expect(opts.cwd).toBe("/tmp");
  });

  test("--env accumulates repeated flags", () => {
    const opts = parseArgs(["node", "cli2mcp", "jq", "--env", "FOO=bar", "--env", "BAZ=qux"]);
    expect(opts.env).toEqual(["FOO=bar", "BAZ=qux"]);
  });

  test("--stderr accept include | drop | error", () => {
    for (const mode of ["include", "drop", "error"] as const) {
      const opts = parseArgs(["node", "cli2mcp", "jq", "--stderr", mode]);
      expect(opts.stderr).toBe(mode);
    }
  });

  test("--stderr invalid value exits with code 1", () => {
    expect(() => parseArgs(["node", "cli2mcp", "jq", "--stderr", "garbage"])).toThrow();
  });
});
