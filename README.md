# mcp-wrap

> Wrap any CLI binary as an MCP server in one line.

```sh
npx mcp-wrap jq
```

Your `jq` is now a tool any MCP client (Claude, Cursor, Gemini CLI, Cline) can call, with the input schema auto-inferred from `jq --help`.

## Install

```sh
npm install -g mcp-wrap
# or run without installing
npx mcp-wrap <command>
```

## Examples

```sh
# Serve ripgrep as an MCP tool
mcp-wrap rg

# Wrap yt-dlp for an agent to use
mcp-wrap yt-dlp --name video-downloader --timeout 120000

# Serve ffmpeg with a custom description
mcp-wrap ffmpeg --description "Run ffmpeg operations on media files"
```

## How it works

1. Spawns the target CLI with `--help` to discover flags and positional args.
2. Heuristically parses the help output into a normalized shape.
3. Synthesizes a JSON Schema describing the tool input.
4. Starts an MCP stdio server exposing one tool named after the CLI.
5. On each `tools/call`, builds argv from the validated params, spawns the child, and returns stdout/stderr/exitCode.

## Known-good CLIs for v0.1

- `jq`, `ripgrep`, `curl`, `yt-dlp`, `imagemagick`, `ollama`
- Any POSIX-style CLI with parseable `--help`.

## Out of scope (v0.1)

- Streamable HTTP MCP transport (stdio only).
- Subcommand trees (so `git`, `docker`, `kubectl` are best-effort).
- Interactive CLIs that read stdin after startup.

## Status

v0.1 — active development. MIT. English only.

## License

MIT © 2026 Ronie Neubauer.
