import { inferType } from "./types.js";

export interface FlagSpec {
  long: string;
  short?: string;
  type: "boolean" | "string" | "number" | "choice";
  choices?: string[];
  description: string;
  repeatable: boolean;
}

export interface PositionalSpec {
  name: string;
  description: string;
  variadic: boolean;
}

export interface CliShape {
  description: string;
  flags: FlagSpec[];
  positionals: PositionalSpec[];
}

const FALLBACK_POSITIONAL: PositionalSpec = { name: "args", description: "", variadic: true };

const FLAG_RE =
  /^\s*(?:-([A-Za-z0-9])(?:\s+[A-Z][A-Z0-9_]*|\s+<[^>]+>)?,\s+)?--([a-zA-Z][\w-]*)([=\s].*)?$/;

const REPEATABLE_RE =
  /multiple times|may be (?:given|specified|used|provided|repeated)|can be (?:given|specified|used|provided|repeated)|repeatable/i;

export function extractShape(helpText: string): CliShape {
  const text = helpText.replace(/\r\n?/g, "\n");

  if (!text.trim()) {
    return { description: "", flags: [], positionals: [FALLBACK_POSITIONAL] };
  }

  const lines = text.split("\n");
  const description = extractDescription(lines);
  const flags = extractFlags(lines);
  const positionals = extractPositionals(lines);

  return {
    description,
    flags,
    positionals: positionals.length > 0 ? positionals : [FALLBACK_POSITIONAL],
  };
}

function extractDescription(lines: string[]): string {
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (/^(usage|synopsis|example|examples|options?|commands?|arguments?):/i.test(trimmed))
      continue;
    if (/^[A-Z][A-Z\s]+:$/.test(trimmed)) continue;

    const nameDash = /^[\w.-]+\s+-+\s+(.+)$/.exec(trimmed);
    if (nameDash) return (nameDash[1] ?? "").trim();

    if (/^[-<[]/.test(trimmed)) continue;
    if (/^\S+\s+v?\d+\.\d+/.test(trimmed)) continue;
    if (/\S+@\S+/.test(trimmed)) continue;

    return trimmed;
  }
  return "";
}

function extractFlags(lines: string[]): FlagSpec[] {
  const flags: FlagSpec[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const match = FLAG_RE.exec(line);
    if (!match) continue;

    const [, short, long, tail = ""] = match;
    if (!long || seen.has(long)) continue;

    const indent = /^\s*/.exec(line)?.[0].length ?? 0;
    const { valueSpec, sameLineDescription } = splitTail(tail);

    let description = sameLineDescription;
    if (!description) description = takeContinuation(lines, i, indent);

    const repeatable = REPEATABLE_RE.test(description) || /\.{3,}/.test(valueSpec);

    const hintMatch = /<[^>]+>/.exec(valueSpec);
    const inferred = inferType(hintMatch ? hintMatch[0] : valueSpec || null);

    const flag: FlagSpec = {
      long,
      type: inferred.type,
      description: description.trim(),
      repeatable,
    };
    if (inferred.choices) flag.choices = inferred.choices;
    if (short) flag.short = short;

    flags.push(flag);
    seen.add(long);
  }

  return flags;
}

function splitTail(tail: string): { valueSpec: string; sameLineDescription: string } {
  if (!tail) return { valueSpec: "", sameLineDescription: "" };

  if (tail.startsWith("=")) {
    const rest = tail.slice(1);
    const split = rest.split(/\s{2,}/, 2);
    return {
      valueSpec: `=${split[0] ?? ""}`.trim(),
      sameLineDescription: (split[1] ?? "").trim(),
    };
  }

  const parts = tail.split(/\s{2,}/, 2);
  return {
    valueSpec: (parts[0] ?? "").trim(),
    sameLineDescription: (parts[1] ?? "").trim(),
  };
}

function takeContinuation(lines: string[], flagLineIdx: number, flagIndent: number): string {
  const next = lines[flagLineIdx + 1];
  if (!next?.trim()) return "";
  const nextIndent = /^\s*/.exec(next)?.[0].length ?? 0;
  if (nextIndent <= flagIndent) return "";
  return next.trim();
}

function extractPositionals(lines: string[]): PositionalSpec[] {
  const positionals: PositionalSpec[] = [];
  const seen = new Set<string>();

  for (const raw of lines) {
    const trimmed = raw.trim();
    const m = /^(?:usage|synopsis):\s*(.+)$/i.exec(trimmed);
    if (!m) continue;

    const usage = m[1] ?? "";
    const tokenRe = /<([^>]+)>|\[([^\]]+)\]/g;

    for (let tok = tokenRe.exec(usage); tok !== null; tok = tokenRe.exec(usage)) {
      const inner = (tok[1] ?? tok[2] ?? "").trim();
      if (!inner) continue;
      const variadic = /\.{3,}/.test(inner);
      const nameRaw =
        inner
          .replace(/\.{3,}/g, "")
          .trim()
          .split(/\s+/)[0] ?? "";
      if (!nameRaw) continue;
      if (/^options?$/i.test(nameRaw)) continue;
      if (!/^[\w-]+$/.test(nameRaw)) continue;
      if (seen.has(nameRaw)) continue;
      seen.add(nameRaw);
      positionals.push({ name: nameRaw, description: "", variadic });
    }

    return positionals;
  }

  return positionals;
}
