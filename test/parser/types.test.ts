import { describe, expect, test } from "vitest";
import { inferType } from "../../src/parser/types.js";

describe("inferType", () => {
  test.each([
    [null, "boolean", undefined],
    ["", "boolean", undefined],
    // string hints
    ["<path>", "string", undefined],
    ["<file>", "string", undefined],
    ["<dir>", "string", undefined],
    ["<string>", "string", undefined],
    ["<name>", "string", undefined],
    ["<s>", "string", undefined],
    // number hints
    ["<n>", "number", undefined],
    ["<num>", "number", undefined],
    ["<ms>", "number", undefined],
    ["<seconds>", "number", undefined],
    ["<count>", "number", undefined],
    ["<size>", "number", undefined],
    // choice hints
    ["<a|b|c>", "choice", ["a", "b", "c"]],
    ["<json|text|csv>", "choice", ["json", "text", "csv"]],
    // unknown → string
    ["<whatever>", "string", undefined],
    ["PATTERN", "string", undefined],
    ["VALUE", "string", undefined],
  ] as const)("inferType(%j) → type=%j choices=%j", (hint, expectedType, expectedChoices) => {
    const result = inferType(hint);
    expect(result.type).toBe(expectedType);
    expect(result.choices).toEqual(expectedChoices);
  });
});
