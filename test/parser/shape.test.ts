import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { extractShape } from "../../src/parser/shape.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) =>
  readFileSync(path.join(__dirname, "..", "fixtures", "help", name), "utf8");

describe("extractShape — fallbacks", () => {
  test("empty input returns shape with variadic args positional", () => {
    const shape = extractShape("");
    expect(shape.flags).toEqual([]);
    expect(shape.positionals).toEqual([{ name: "args", description: "", variadic: true }]);
    expect(shape.description).toBe("");
  });

  test("unparseable garbage still returns variadic args fallback", () => {
    const shape = extractShape("@@@ %%% !!!\n\n...");
    expect(shape.positionals).toEqual([{ name: "args", description: "", variadic: true }]);
  });
});

describe("extractShape — synthetic helps", () => {
  test("boolean flag without value hint", () => {
    const help = [
      "my-tool - does things",
      "",
      "Usage: my-tool [options]",
      "",
      "Options:",
      "  -v, --verbose         print verbose output",
    ].join("\n");

    const shape = extractShape(help);
    const flag = shape.flags.find((f) => f.long === "verbose");
    expect(flag).toBeDefined();
    expect(flag?.short).toBe("v");
    expect(flag?.type).toBe("boolean");
    expect(flag?.description).toMatch(/verbose/i);
    expect(flag?.repeatable).toBe(false);
  });

  test("flag with <value> hint gets non-boolean type", () => {
    const help = ["Options:", "      --config <path>     path to config file"].join("\n");
    const shape = extractShape(help);
    const flag = shape.flags.find((f) => f.long === "config");
    expect(flag).toBeDefined();
    expect(flag?.type).not.toBe("boolean");
  });

  test("flag with =VALUE style (ripgrep convention)", () => {
    const help = ["Options:", "    -f PATTERNFILE, --file=PATTERNFILE    pattern file"].join("\n");
    const shape = extractShape(help);
    const flag = shape.flags.find((f) => f.long === "file");
    expect(flag).toBeDefined();
    expect(flag?.short).toBe("f");
    expect(flag?.type).not.toBe("boolean");
  });

  test("repeatable detected from description wording", () => {
    const help = [
      "Options:",
      "  -e, --regexp <pat>    pattern; can be provided multiple times",
    ].join("\n");
    const shape = extractShape(help);
    const flag = shape.flags.find((f) => f.long === "regexp");
    expect(flag?.repeatable).toBe(true);
  });

  test("description is first narrative line (not Usage)", () => {
    const help = [
      "Usage: foo [options]",
      "",
      "Foo frobs the widgets and returns them.",
      "",
      "Options:",
      "  --x   do x",
    ].join("\n");
    const shape = extractShape(help);
    expect(shape.description).toBe("Foo frobs the widgets and returns them.");
  });

  test("positionals extracted from Usage line", () => {
    const help = [
      "Usage: jq [options] <filter> [file...]",
      "",
      "Options:",
      "  -n  null input",
    ].join("\n");
    const shape = extractShape(help);
    const names = shape.positionals.map((p) => p.name);
    expect(names).toContain("filter");
    expect(names).toContain("file");
    expect(shape.positionals.find((p) => p.name === "file")?.variadic).toBe(true);
  });

  test("CRLF line endings are normalized", () => {
    const help = "Usage: x [opts]\r\n\r\nOptions:\r\n  -v, --verbose   be loud\r\n";
    const shape = extractShape(help);
    expect(shape.flags.find((f) => f.long === "verbose")?.short).toBe("v");
  });
});

describe("extractShape — real fixtures", () => {
  test("jq --help", () => {
    const shape = extractShape(fixture("jq.txt"));

    expect(shape.description).toMatch(/JSON/i);

    const longs = new Set(shape.flags.map((f) => f.long));
    for (const expected of [
      "null-input",
      "raw-input",
      "slurp",
      "compact-output",
      "raw-output",
      "sort-keys",
      "tab",
      "indent",
      "arg",
      "argjson",
      "exit-status",
      "version",
      "help",
    ]) {
      expect(longs.has(expected), `missing flag --${expected}`).toBe(true);
    }

    expect(shape.flags.find((f) => f.long === "slurp")?.short).toBe("s");
    expect(shape.flags.find((f) => f.long === "slurp")?.type).toBe("boolean");
    expect(shape.flags.find((f) => f.long === "indent")?.type).not.toBe("boolean");
  });

  test("rg --help", () => {
    const shape = extractShape(fixture("rg.txt"));

    const longs = new Set(shape.flags.map((f) => f.long));
    for (const expected of ["regexp", "file", "ignore-case", "invert-match", "files"]) {
      expect(longs.has(expected), `missing flag --${expected}`).toBe(true);
    }

    expect(shape.flags.find((f) => f.long === "regexp")?.short).toBe("e");
    expect(shape.flags.find((f) => f.long === "regexp")?.type).not.toBe("boolean");
    expect(shape.flags.find((f) => f.long === "regexp")?.repeatable).toBe(true);
  });

  test("curl --help", () => {
    const shape = extractShape(fixture("curl.txt"));

    const longs = new Set(shape.flags.map((f) => f.long));
    for (const expected of ["append", "basic", "cacert", "cert", "compressed", "cookie"]) {
      expect(longs.has(expected), `missing flag --${expected}`).toBe(true);
    }

    expect(shape.flags.find((f) => f.long === "append")?.short).toBe("a");
    expect(shape.flags.find((f) => f.long === "append")?.type).toBe("boolean");
    expect(shape.flags.find((f) => f.long === "cacert")?.type).not.toBe("boolean");
  });
});
