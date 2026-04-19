import Ajv from "ajv";
import { describe, expect, test } from "vitest";
import type { CliShape } from "../src/parser/shape.js";
import { toInputSchema } from "../src/schema.js";

const ajv = new Ajv();

// Fixture 1: boolean + string flags, no positionals
const shapeFlags: CliShape = {
  description: "A CLI tool",
  flags: [
    { long: "verbose", type: "boolean", description: "Enable verbose output", repeatable: false },
    {
      long: "output",
      short: "o",
      type: "string",
      description: "Output file path",
      repeatable: false,
    },
    { long: "count", type: "number", description: "Number of results", repeatable: false },
  ],
  positionals: [],
};

// Fixture 2: choice + repeatable flags, positionals
const shapeChoiceRepeat: CliShape = {
  description: "Another tool",
  flags: [
    {
      long: "format",
      type: "choice",
      choices: ["json", "text", "csv"],
      description: "Output format",
      repeatable: false,
    },
    { long: "include", type: "string", description: "Include pattern", repeatable: true },
  ],
  positionals: [{ name: "files", description: "Input files", variadic: true }],
};

// Fixture 3: only positionals (fallback shape from unknown CLI)
const shapeFallback: CliShape = {
  description: "",
  flags: [],
  positionals: [{ name: "args", description: "", variadic: true }],
};

describe("toInputSchema — shape 1 (boolean, string, number flags)", () => {
  const schema = toInputSchema(shapeFlags);

  test("produces a valid JSON Schema object", () => {
    const validate = ajv.compile(schema);
    expect(validate({ verbose: true, output: "out.txt", count: 5 })).toBe(true);
  });

  test("additionalProperties is false", () => {
    expect(schema.additionalProperties).toBe(false);
    const validate = ajv.compile(schema);
    expect(validate({ unknown: "x" })).toBe(false);
  });

  test("boolean flag maps to type boolean", () => {
    expect(schema.properties?.verbose).toEqual({
      type: "boolean",
      description: "Enable verbose output",
    });
  });

  test("string flag maps to type string", () => {
    expect(schema.properties?.output).toEqual({
      type: "string",
      description: "Output file path",
    });
  });

  test("number flag maps to type number", () => {
    expect(schema.properties?.count).toEqual({
      type: "number",
      description: "Number of results",
    });
  });

  test("no args property when no positionals", () => {
    expect(schema.properties?.args).toBeUndefined();
  });
});

describe("toInputSchema — shape 2 (choice, repeatable, positionals)", () => {
  const schema = toInputSchema(shapeChoiceRepeat);

  test("produces a valid JSON Schema object", () => {
    const validate = ajv.compile(schema);
    expect(validate({ format: "json", include: ["*.ts"], args: ["a.txt"] })).toBe(true);
  });

  test("choice flag maps to string with enum", () => {
    expect(schema.properties?.format).toEqual({
      type: "string",
      enum: ["json", "text", "csv"],
      description: "Output format",
    });
    const validate = ajv.compile(schema);
    expect(validate({ format: "invalid" })).toBe(false);
  });

  test("repeatable flag maps to array of its item type", () => {
    expect(schema.properties?.include).toEqual({
      type: "array",
      items: { type: "string" },
      description: "Include pattern",
    });
  });

  test("positionals produce args as array of strings", () => {
    expect(schema.properties?.args).toEqual({
      type: "array",
      items: { type: "string" },
    });
    const validate = ajv.compile(schema);
    expect(validate({ args: ["a.txt", "b.txt"] })).toBe(true);
  });
});

describe("toInputSchema — shape 3 (fallback: only variadic positional)", () => {
  const schema = toInputSchema(shapeFallback);

  test("produces a valid JSON Schema object accepting string arrays", () => {
    const validate = ajv.compile(schema);
    expect(validate({ args: ["."] })).toBe(true);
    expect(validate({})).toBe(true);
  });

  test("has args as array of strings", () => {
    expect(schema.properties?.args).toEqual({
      type: "array",
      items: { type: "string" },
    });
  });

  test("additionalProperties is false", () => {
    const validate = ajv.compile(schema);
    expect(validate({ unknown: true })).toBe(false);
  });
});
