import { describe, expect, test } from "vitest";
import { buildArgv } from "../src/argv.js";
import type { CliShape } from "../src/parser/shape.js";

const baseShape: CliShape = {
  description: "",
  flags: [
    { long: "verbose", type: "boolean", description: "", repeatable: false },
    { long: "output", short: "o", type: "string", description: "", repeatable: false },
    { long: "count", type: "number", description: "", repeatable: false },
    {
      long: "format",
      type: "choice",
      choices: ["json", "text"],
      description: "",
      repeatable: false,
    },
    { long: "include", type: "string", description: "", repeatable: true },
  ],
  positionals: [{ name: "files", description: "", variadic: true }],
};

describe("buildArgv", () => {
  test("boolean true becomes --flag", () => {
    expect(buildArgv(baseShape, { verbose: true })).toEqual(["--verbose"]);
  });

  test("boolean false is omitted", () => {
    expect(buildArgv(baseShape, { verbose: false })).toEqual([]);
  });

  test("string flag becomes --flag value", () => {
    expect(buildArgv(baseShape, { output: "out.txt" })).toEqual(["--output", "out.txt"]);
  });

  test("number flag becomes --flag value as string", () => {
    expect(buildArgv(baseShape, { count: 5 })).toEqual(["--count", "5"]);
  });

  test("choice flag becomes --flag value", () => {
    expect(buildArgv(baseShape, { format: "json" })).toEqual(["--format", "json"]);
  });

  test("repeatable string array becomes multiple --flag value pairs", () => {
    expect(buildArgv(baseShape, { include: ["*.ts", "*.js"] })).toEqual([
      "--include",
      "*.ts",
      "--include",
      "*.js",
    ]);
  });

  test("positional args array is appended at the end", () => {
    expect(buildArgv(baseShape, { verbose: true, args: ["a.txt", "b.txt"] })).toEqual([
      "--verbose",
      "a.txt",
      "b.txt",
    ]);
  });

  test("flags come before positionals regardless of input key order", () => {
    expect(buildArgv(baseShape, { args: ["x"], output: "o.txt" })).toEqual([
      "--output",
      "o.txt",
      "x",
    ]);
  });

  test("empty input yields empty argv", () => {
    expect(buildArgv(baseShape, {})).toEqual([]);
  });

  test("unknown input keys are ignored (not surfaced as argv)", () => {
    expect(buildArgv(baseShape, { bogus: "x", verbose: true })).toEqual(["--verbose"]);
  });
});
