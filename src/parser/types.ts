import type { FlagSpec } from "./shape.js";

export interface TypeResult {
  type: FlagSpec["type"];
  choices?: string[];
}

const STRING_HINTS = new Set(["path", "file", "dir", "string", "name", "s"]);
const NUMBER_HINTS = new Set(["n", "num", "ms", "seconds", "count", "size"]);

export function inferType(valueHint: string | null): TypeResult {
  if (!valueHint) return { type: "boolean" };

  const angleMatch = /^<([^>]+)>$/.exec(valueHint.trim());
  if (angleMatch) {
    const inner = angleMatch[1] ?? "";
    if (inner.includes("|")) {
      return { type: "choice", choices: inner.split("|").map((c) => c.trim()) };
    }
    const lower = inner.toLowerCase();
    if (NUMBER_HINTS.has(lower)) return { type: "number" };
    if (STRING_HINTS.has(lower)) return { type: "string" };
    return { type: "string" };
  }

  return { type: "string" };
}
