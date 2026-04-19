# cli2mcp

[![npm version](https://img.shields.io/npm/v/cli2mcp?color=crimson&label=npm)](https://www.npmjs.com/package/cli2mcp)
[![npm downloads](https://img.shields.io/npm/dm/cli2mcp?color=blue&label=downloads)](https://www.npmjs.com/package/cli2mcp)
[![CI](https://img.shields.io/github/actions/workflow/status/RonieNeubauer/mcp-wrap/ci.yml?branch=main&label=CI)](https://github.com/RonieNeubauer/mcp-wrap/actions)
[![node](https://img.shields.io/node/v/cli2mcp?color=green)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/cli2mcp?color=gray)](LICENSE)

> Wrap any CLI binary as an MCP server in one line.

```sh
npx cli2mcp jq
```

Your `jq` is now an MCP tool any client (Claude Desktop, Cursor, Cline, Gemini CLI) can call. The input schema is auto-inferred from `jq --help` — no hand-written tool definitions, no SDK boilerplate.

![demo](docs/demo.gif)

## Install

```sh
npm install -g cli2mcp
# or run without installing
npx cli2mcp <command>
```

Requires Node.js 22+.

## Quickstart — wrap `jq` for Claude Desktop

1. Install `jq` (`brew install jq`, `apt install jq`, `choco install jq`).
2. Add to `claude_desktop_config.json`:

    ```json
    {
      "mcpServers": {
        "jq": {
          "command": "npx",
          "args": ["-y", "cli2mcp", "jq"]
        }
      }
    }
    ```

3. Restart Claude Desktop. Claude can now call `jq` directly:

    > **You:** Using the `jq` tool, extract every `.name` field from `{"users":[{"name":"ada"},{"name":"lin"}]}`.
    >
    > **Claude** *(calls `jq` with `{"args": [".users[].name"], "stdin": "{\"users\":[{\"name\":\"ada\"},{\"name\":\"lin\"}]}"}`)*
    > `"ada"` / `"lin"`

The tool's `inputSchema` is synthesized from `jq --help` — flags like `--raw-output`, `--compact-output`, `--slurp` show up as typed properties; positional filter and files become the `args` array.

## More examples

```sh
# Ripgrep as an MCP search tool
cli2mcp rg

# yt-dlp with a custom name and a longer timeout
cli2mcp yt-dlp --name video-downloader --timeout 120000

# ffmpeg with a hand-written tool description
cli2mcp ffmpeg --description "Run ffmpeg operations on media files"

# Inject env vars into the child
cli2mcp curl --env HTTP_PROXY=http://localhost:8080
```

## Options

```
cli2mcp <command> [options]

  --name <s>          tool name exposed via MCP (default: <command>)
  --description <s>   tool description (default: first line of --help)
  --timeout <ms>      per-invocation timeout (default: 60000)
  --cwd <path>        working directory for the child (default: $PWD)
  --env <k=v>         extra env vars (repeatable)
  --stderr <mode>     include | drop | error (default: include)
  -h, --help          show help
```

## How it works

1. Spawns the target CLI with `--help` and captures stdout + stderr.
2. Heuristically parses the help text into a normalized `CliShape` (flags, positionals, description).
3. Synthesizes a JSON Schema for the MCP tool's input.
4. Starts an MCP stdio server exposing one tool named after the CLI.
5. On each `tools/call`, builds argv from the validated params, spawns the child via `execa`, and returns stdout (and stderr, unless `--stderr drop`). Non-zero exits are surfaced as `isError: true`.

## Known-good CLIs for v0.1

`jq`, `ripgrep`, `curl`, `yt-dlp`, `imagemagick`, `ollama` — plus any POSIX-style CLI with a parseable `--help`.

## Out of scope (v0.1)

- Streamable HTTP MCP transport (stdio only).
- Subcommand trees (`git`, `docker`, `kubectl` are best-effort — the top-level `--help` is what's parsed).
- Interactive CLIs that read stdin after startup.

## Status

v0.1 — active development. Cross-platform (Linux, macOS, Windows). MIT.

## License

MIT © 2026 Ronie Neubauer.
