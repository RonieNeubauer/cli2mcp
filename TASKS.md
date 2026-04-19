# mcp-wrap — task list for Codex

> **For Codex:** execute tasks in order. One task = one commit. On ambiguity, add `HANDOFF: <question>` as comment in this file and stop. Read `CODEX.md` for operating rules first.

## Current state

- **Phase:** 3 (task 3.1 complete)
- **Last commit:** `feat(schema): inputSchema synthesis`
- **Blocked on:** nothing

---

## Phase 0 — Scaffold (~2h)

### Task 0.1 — Init repo
- [ ] `git init -b main`
- [ ] Create `package.json`:
  ```json
  {
    "name": "mcp-wrap",
    "version": "0.0.0",
    "description": "Wrap any CLI binary as an MCP server in one line",
    "type": "module",
    "bin": { "mcp-wrap": "./dist/index.js" },
    "main": "./dist/index.js",
    "files": ["dist"],
    "engines": { "node": ">=22" },
    "license": "MIT",
    "author": "Ronie Neubauer",
    "scripts": {
      "dev": "tsup --watch",
      "build": "tsup",
      "test": "vitest run",
      "test:watch": "vitest",
      "typecheck": "tsc --noEmit",
      "lint": "biome check .",
      "format": "biome format --write ."
    },
    "dependencies": {
      "@modelcontextprotocol/sdk": "^1.29.0",
      "commander": "^12.1.0",
      "execa": "^9.5.1"
    },
    "devDependencies": {
      "@biomejs/biome": "^2.4.0",
      "@types/node": "^22.10.0",
      "tsup": "^8.3.5",
      "typescript": "^5.7.2",
      "vitest": "^2.1.8"
    }
  }
  ```
- [ ] Create `.gitignore` with: `node_modules`, `dist`, `.DS_Store`, `.env`, `coverage`
- [ ] Create `.nvmrc` containing `22`
- [ ] Create `LICENSE` (MIT, 2026, Ronie Neubauer)
- [ ] `pnpm install`
- [ ] Commit: `chore: scaffold project`

### Task 0.2 — Toolchain
- [ ] `tsconfig.json`: extends recommended, `strict: true`, `target: ES2022`, `module: ESNext`, `moduleResolution: Bundler`, `outDir: dist`, `rootDir: src`, `declaration: true`, `noUncheckedIndexedAccess: true`.
- [ ] `tsup.config.ts`:
  ```ts
  import { defineConfig } from "tsup";
  export default defineConfig({
    entry: ["src/index.ts"],
    format: ["esm"],
    target: "node22",
    banner: { js: "#!/usr/bin/env node" },
    dts: false,
    sourcemap: true,
    clean: true,
  });
  ```
- [ ] `biome.json`: recommended, `indentStyle: space`, `indentWidth: 2`, `lineWidth: 100`, rule `noExplicitAny: error`.
- [ ] `src/index.ts`: `console.log("mcp-wrap v0.0.0");`
- [ ] Verify: `pnpm build` produces `dist/index.js`, executable.
- [ ] Commit: `chore: toolchain`

---

## Phase 1 — CLI skeleton (~1h)

### Task 1.1 — Arg parsing with commander
- [ ] `src/cli.ts`: export `parseArgs(argv: string[])` returning a typed `Options` object matching SPEC.md §5.
- [ ] Handle repeated `--env` flags via `.option("--env <k=v>", ..., collect, [])`.
- [ ] Validate `--stderr` is one of `include|drop|error`; reject otherwise.
- [ ] `src/index.ts`: call `parseArgs(process.argv)`, print parsed options (for now).
- [ ] `test/cli.test.ts`: verify each flag parses correctly; invalid `--stderr` exits with code 1.
- [ ] Commit: `feat(cli): arg parsing`

---

## Phase 2 — Help parser (~1 day)

### Task 2.1 — Spawn target with --help
- [x] `src/parser/spawn.ts`: `export async function captureHelp(cmd: string): Promise<string>`.
- [x] Uses `execa(cmd, ["--help"], { timeout: 5000, reject: false })`.
- [x] Returns `stdout + "\n" + stderr` (some CLIs like `jq` emit help to stderr).
- [x] On non-zero exit AND empty stdout+stderr, throw `NoHelpError` with cmd name.
- [x] `test/parser/spawn.test.ts`: mock execa; verify merged output; verify error thrown on empty.
- [x] Commit: `feat(parser): capture --help output`

### Task 2.2 — Normalize help to CliShape
- [x] `src/parser/shape.ts`: define types:
  ```ts
  export interface CliShape {
    description: string;
    flags: FlagSpec[];
    positionals: PositionalSpec[];
  }
  export interface FlagSpec {
    long: string;       // without -- prefix
    short?: string;     // without - prefix
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
  ```
- [x] `extractShape(helpText: string): CliShape` — heuristic:
  - First non-empty, non-usage line → `description`.
  - Lines matching `/^\s*(-\w,\s+)?--[\w-]+(\s+<[^>]+>)?\s+.+/` → flags.
  - Detect `--long <value>` vs `--long` (boolean).
  - Positional extraction from `Usage:` line best-effort.
- [x] Always return a valid shape. On heavy failure, return shape with one positional `args` (variadic).
- [x] `test/fixtures/help/{jq,rg,curl}.txt` + `test/parser/shape.test.ts` covers all three.
- [x] Commit: `feat(parser): CliShape extraction`

### Task 2.3 — Type inference
- [x] `src/parser/types.ts`: `inferType(valueHint: string | null): FlagSpec["type"]`.
  - `null` or empty → `"boolean"`.
  - `<path>|<file>|<dir>|<string>|<name>|<s>` → `"string"`.
  - `<n>|<num>|<ms>|<seconds>|<count>|<size>` → `"number"`.
  - `<a|b|c>` → `"choice"` with `choices = [a, b, c]`.
  - Unknown → `"string"`.
- [x] Wire into `extractShape`.
- [x] `test/parser/types.test.ts`: table-driven.
- [x] Commit: `feat(parser): type inference`

---

## Phase 3 — Schema synthesis (~2h)

### Task 3.1 — CliShape → JSON Schema
- [x] `src/schema.ts`: `export function toInputSchema(shape: CliShape): JsonSchema`.
- [x] Each `FlagSpec` → property on `properties`. Type mapped, `description` preserved, `repeatable → type: array`.
- [x] Positionals → property `args` of `type: array, items: string`.
- [x] `additionalProperties: false`.
- [x] `test/schema.test.ts`: 3 fixture shapes → valid JSON Schemas (validate with `ajv` in test only — add ajv to devDeps).
- [x] Commit: `feat(schema): inputSchema synthesis`

---

## Phase 4 — MCP server (~1 day)

### Task 4.1 — MCP stdio server
- [ ] `src/server.ts`: `export async function startServer(cmd: string, opts: Options): Promise<void>`.
- [ ] Uses `@modelcontextprotocol/sdk/server/index.js` `Server` + `StdioServerTransport`.
- [ ] On start: run parser → get shape → synthesize schema → register one tool.
- [ ] Tool handler: validate input → build argv → `execa(cmd, argv, { timeout: opts.timeout, cwd: opts.cwd, env: { ...process.env, ...opts.env } })`.
- [ ] Return `{ content: [{ type: "text", text: result.stdout }] }`.
- [ ] On non-zero exit: throw MCP error with stderr (unless `opts.stderr === "drop"`).
- [ ] `test/server.test.ts`: use an in-memory transport pair; spawn a tiny echo CLI fixture; assert handshake + tools/list + tools/call round-trip.
- [ ] Commit: `feat(server): stdio MCP wrapping a child CLI`

### Task 4.2 — Wire index
- [ ] `src/index.ts`: `parseArgs → startServer(opts.command, opts)`.
- [ ] On SIGINT/SIGTERM, graceful close: kill child if running, then exit 0.
- [ ] Integration test: spawn `mcp-wrap jq` as child process in test; send MCP `initialize` + `tools/list` + `tools/call {filter: "."}` with a known input; assert output.
- [ ] Commit: `feat: end-to-end mcp-wrap wiring`

---

## Phase 5 — Launch (~1 day)

### Task 5.1 — README finalize
- [ ] Update `README.md` with a working snippet and one realistic `jq` demo call.
- [ ] Add `docs/demo.gif` placeholder reference (user records the GIF manually).
- [ ] HANDOFF: user records the demo gif.
- [ ] Commit: `docs: finalize README`

### Task 5.2 — Pre-publish checks
- [ ] `pnpm build && pnpm test && pnpm typecheck && pnpm lint` all green.
- [ ] `npm pack --dry-run` — verify `dist/` is the only thing shipped, package size < 500KB.
- [ ] HANDOFF: user runs `npm publish` (requires 2FA + npm login).

### Task 5.3 — Tag + social (after user publishes)
- [ ] `git tag v0.1.0 && git push --tags`
- [ ] HANDOFF: user does HN + r/LocalLLaMA + Twitter launch posts.

---

## Fixture checklist (bundled in test/fixtures/help/)

- [x] `jq.txt` — `jq --help` output
- [x] `rg.txt` — `rg --help` output
- [x] `curl.txt` — `curl --help` output (full)
- [ ] `yt-dlp.txt` — `yt-dlp --help` output

Codex: capture these by running the real CLIs on your machine and checking in verbatim. If a CLI is not installed, HANDOFF and ask.
