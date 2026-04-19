# cli2mcp

[![npm version](https://img.shields.io/npm/v/cli2mcp?color=crimson&label=npm)](https://www.npmjs.com/package/cli2mcp)
[![npm downloads](https://img.shields.io/npm/dm/cli2mcp?color=blue&label=downloads)](https://www.npmjs.com/package/cli2mcp)
[![CI](https://img.shields.io/github/actions/workflow/status/RonieNeubauer/mcp-wrap/ci.yml?branch=main&label=CI)](https://github.com/RonieNeubauer/mcp-wrap/actions)
[![node](https://img.shields.io/node/v/cli2mcp?color=green)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/cli2mcp?color=gray)](LICENSE)

**Every CLI tool you already have installed — available to your AI agent in 10 seconds.**

`cli2mcp` reads a tool's `--help` output, generates a typed MCP tool schema on the fly, and starts a stdio server. No wrapper code. No SDK. No manifest files. If the binary has a `--help` flag, it works.

```sh
npx cli2mcp ffmpeg
npx cli2mcp rg
npx cli2mcp yt-dlp
npx cli2mcp curl
npx cli2mcp sqlite3
npx cli2mcp pandoc
# ...any CLI with --help
```

![demo](docs/demo.gif)

---

## Install

```sh
npm install -g cli2mcp
```

Node.js 22+ required.

---

## Quickstart

Pick any CLI tool. Add it to your MCP client config. Done.

**Claude Desktop** — `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ripgrep":  { "command": "npx", "args": ["-y", "cli2mcp", "rg",     "--name", "ripgrep"] },
    "jq":       { "command": "npx", "args": ["-y", "cli2mcp", "jq"] },
    "ffmpeg":   { "command": "npx", "args": ["-y", "cli2mcp", "ffmpeg"] },
    "yt-dlp":   { "command": "npx", "args": ["-y", "cli2mcp", "yt-dlp", "--timeout", "120000"] },
    "imagemagick": { "command": "npx", "args": ["-y", "cli2mcp", "magick"] },
    "sqlite":   { "command": "npx", "args": ["-y", "cli2mcp", "sqlite3"] }
  }
}
```

**Cursor / Cline / Windsurf** — same `mcpServers` block in their respective config files.

**Gemini CLI** — `~/.gemini/settings.json`

```json
{
  "mcpServers": {
    "ripgrep": { "command": "npx", "args": ["-y", "cli2mcp", "rg", "--name", "ripgrep"] }
  }
}
```

---

## What gets exposed

`cli2mcp` parses the target's `--help` and builds a full JSON Schema:

| Help output | MCP schema |
|---|---|
| `--flag` | `boolean` property |
| `--flag <value>` | `string` property |
| `--flag <n\|ms\|bytes>` | `number` property |
| `--flag <a\|b\|c>` | `enum` with choices |
| Repeatable flags | `array` of strings |
| Positional args | `args` array |
| Piped stdin | `stdin` string |

Every flag the CLI supports becomes a typed, documented property the AI can use. The AI sees the same flags you do — it cannot hallucinate flags that don't exist.

---

## Options

```
cli2mcp <command> [options]

Options:
  --name <name>         Tool name shown to the AI           (default: <command>)
  --description <text>  Tool description shown to the AI    (default: first --help line)
  --timeout <ms>        Subprocess timeout per call         (default: 60000)
  --cwd <path>          Working directory for subprocess    (default: process.cwd())
  --env <KEY=VALUE>     Extra environment variables         (repeatable)
  --stderr <mode>       How to handle stderr:
                          include  →  append to tool output  (default)
                          drop     →  discard stderr
                          error    →  non-zero exit on any stderr
  -h, --help            Show help
```

### Pipe stdin into the subprocess

Pass `stdin` in your tool call payload to pipe data into the process:

```json
{ "args": [".name"], "stdin": "{\"name\": \"cli2mcp\"}" }
```

---

## How it works

```
cli2mcp rg
   │
   ├─ 1. spawn: rg --help   →  capture stdout + stderr
   ├─ 2. parse --help text  →  CliShape { flags, positionals, description }
   ├─ 3. synthesize         →  JSON Schema (inputSchema)
   ├─ 4. register MCP tool  →  name: "rg", schema: <above>
   └─ 5. stdio MCP server   →  ready for client connection

On tools/call:
   input params  →  argv builder  →  execa(rg, argv)  →  stdout → content[text]
```

Non-zero exit codes are returned as `isError: true` with stderr included (unless `--stderr drop`).

---

## Compatibility

| MCP Client | Supported |
|---|---|
| Claude Desktop | ✅ |
| Cursor | ✅ |
| Cline | ✅ |
| Windsurf | ✅ |
| Gemini CLI | ✅ |
| Any MCP stdio client | ✅ |

Tested on Linux, macOS, and Windows.

---

## Limitations

- **Subcommand trees** (`git commit`, `docker run`, `kubectl apply`) — only top-level `--help` is parsed. Subcommands are not individually exposed as tools.
- **Interactive CLIs** — tools that read from stdin interactively after startup (e.g. `python`, `node` REPLs) are not supported.
- **HTTP transport** — stdio only in v0.1. Streamable HTTP coming in a future release.

---

## License

MIT © 2026 Ronie Neubauer.
