# cli2mcp — design spec

- **Status:** Approved 2026-04-18
- **Tagline:** Wrap any CLI binary as an MCP server in one line.
- **Distribution:** `npx cli2mcp <command>` on npm. MIT. English only.

## 1. Problem

MCP (Model Context Protocol) is the hottest protocol in the agent ecosystem as of April 2026. Exposing an existing CLI as an MCP tool still requires boilerplate: wire the SDK, hand-write a tool schema, spawn a child process, marshal args. There are thousands of battle-tested CLIs (ffmpeg, ripgrep, jq, curl, yt-dlp, ollama, imagemagick, docker, git) that devs want to expose as agent tools without writing code.

## 2. Solution

`cli2mcp <cli>` starts an MCP stdio server that wraps the target CLI. Input schema is inferred from parsing `<cli> --help`. The CLI becomes one MCP tool. On each tool call, args are constructed from validated params and the child process is spawned.

## 3. Scope — v0.1

### In scope
- `cli2mcp <command>` CLI entry.
- Auto-detection of flags and positional args from `--help`.
- Type inference (boolean, string, number, choice).
- Fallback schema (single `args: string[]` positional) when parsing fails.
- MCP stdio server from `@modelcontextprotocol/sdk`.
- Child-process invocation via `execa`.
- Configurable timeout, cwd, env, stderr handling.
- Published to npm; works on macOS, Linux. Windows best-effort.

### Out of scope
- Streamable HTTP MCP transport.
- Subcommand trees (v0.2).
- Interactive CLIs (stdin after startup).
- Bundled GUI or dashboard.

## 4. Architecture

Single Node process. Three modules, no package layers.

```
user$ cli2mcp ffmpeg
         │
         ▼
   parser/spawn.ts      ← runs `ffmpeg --help`, captures raw text
         │
         ▼
   parser/shape.ts      ← text → CliShape { flags[], positionals[], description }
         │
         ▼
   parser/types.ts      ← heuristic: value hint → JSON Schema type
         │
         ▼
   schema.ts            ← CliShape → MCP tool inputSchema (JSON Schema)
         │
         ▼
   server.ts            ← @modelcontextprotocol/sdk Server, stdio transport
         │
         ▼  on tools/call
   execa(cmd, argv)     ← spawn child, return { stdout, stderr, exitCode } as tool result
```

## 5. CLI surface

```
cli2mcp <command> [options]

Positional:
  <command>           CLI binary to wrap (must be on $PATH)

Options:
  --name <s>          tool name exposed via MCP (default: <command>)
  --description <s>   tool description (default: first line of --help)
  --timeout <ms>      per-invocation timeout (default: 60000)
  --cwd <path>        working directory for child (default: $PWD)
  --env <k=v>         additional env vars (repeatable)
  --stderr <mode>     include | drop | error  (default: include)
  --version           print cli2mcp version
  -h, --help          show this help
```

## 6. Envelope for tool invocation

On `tools/call`, the input matches the synthesized schema. cli2mcp converts it to argv:

- Boolean flags: `--foo` when value is `true`, omitted otherwise.
- String/number flags: `--foo value`.
- Repeated flags: array values become multiple `--foo v1 --foo v2`.
- Positionals: concatenated in order.
- `stdin` (reserved property, always exposed as optional string): piped to the child via standard input. Covers the common one-shot pipe use case (`echo '{...}' | jq ...`). Interactive stdin (multiple reads after startup) is still out of scope.
- Unknown extra keys: rejected with JSON-RPC error.

The tool response has `content: [{ type: "text", text: stdout }]`. On non-zero exit, MCP error with `stderr` in message (unless `--stderr drop`).

## 7. Risks

| Risk | Mitigation |
|---|---|
| npm name `cli2mcp` taken | Day-0 check. Fallbacks: `cli2mcp`, `mcpx`, `mcpcli`, `@ronieneubauer/cli2mcp`. |
| `--help` parsing heuristics miss CLIs with unusual formats | Fallback to permissive schema (`args: string[]`). Document known-good list in README. |
| Child process leaks on shutdown | SIGTERM then SIGKILL after 2s. Test on process exit and SIGINT. |
| Anthropic or FastMCP ship equivalent | Window estimated 3–6 months. Prioritize distribution over polish. |
| Windows stdio quirks | Windows is best-effort in v0.1. Document caveats. |

## 8. Stack (pinned)

- **Runtime:** Node ≥ 22 (engines).
- **Language:** TypeScript 5.7, `strict: true`, ESM only.
- **Deps (runtime):**
  - `@modelcontextprotocol/sdk@^1.29.0`
  - `commander@^12`
  - `execa@^9`
- **Deps (dev):**
  - `tsup@^8` (bundle)
  - `vitest@^2`
  - `@biomejs/biome@^2.4`
  - `typescript@^5.7`
- **No other deps.** v0.1 must stay <5 runtime deps.

## 9. Roadmap (post v0.1)

- Subcommand trees (v0.2) — `cli2mcp git` exposes one tool per subcommand.
- Streamable HTTP transport (v0.2).
- `cli2mcp.config.ts` for schema overrides per CLI.
- Auto-publish: `cli2mcp publish <cmd>` pushes a dedicated npm package `cli2mcp-<cmd>`.
- MCP server marketplace integration (wait and see).

## 10. Non-goals (never)

- GUI.
- Cloud service.
- Non-MCP protocols.
- Authentication / user management.
- Scripting its own DSL on top of `--help`.
