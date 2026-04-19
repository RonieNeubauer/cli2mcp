# cli2mcp

[![npm version](https://img.shields.io/npm/v/cli2mcp?color=crimson&label=npm)](https://www.npmjs.com/package/cli2mcp)
[![npm downloads](https://img.shields.io/npm/dm/cli2mcp?color=blue&label=downloads)](https://www.npmjs.com/package/cli2mcp)
[![CI](https://img.shields.io/github/actions/workflow/status/RonieNeubauer/mcp-wrap/ci.yml?branch=main&label=CI)](https://github.com/RonieNeubauer/mcp-wrap/actions)
[![node](https://img.shields.io/node/v/cli2mcp?color=green)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/cli2mcp?color=gray)](LICENSE)

> Turn any CLI tool into an MCP server — no code, no config, one command.

```sh
npx cli2mcp rg        # ripgrep is now an MCP tool
npx cli2mcp ffmpeg    # so is ffmpeg
npx cli2mcp yt-dlp   # and yt-dlp
npx cli2mcp curl      # anything with --help works
```

Claude, Cursor, Cline, Gemini CLI — any MCP client can now call your CLI tools directly. The input schema is auto-generated from the tool's `--help` output. No SDK. No boilerplate. No wrapper code.

![demo](docs/demo.gif)

## Install

```sh
npm install -g cli2mcp
```

Requires Node.js 22+.

## Usage

```sh
cli2mcp <command> [options]

  --name <s>          tool name exposed to the AI (default: <command>)
  --description <s>   tool description (default: first line of --help)
  --timeout <ms>      per-call timeout in milliseconds (default: 60000)
  --cwd <path>        working directory for the subprocess (default: $PWD)
  --env <k=v>         extra environment variables, repeatable
  --stderr <mode>     include | drop | error (default: include)
```

## Add to Claude Desktop

Open `claude_desktop_config.json` and add any CLI you want:

```json
{
  "mcpServers": {
    "ripgrep": {
      "command": "npx",
      "args": ["-y", "cli2mcp", "rg", "--name", "ripgrep"]
    },
    "ffmpeg": {
      "command": "npx",
      "args": ["-y", "cli2mcp", "ffmpeg"]
    },
    "yt-dlp": {
      "command": "npx",
      "args": ["-y", "cli2mcp", "yt-dlp", "--name", "video-downloader", "--timeout", "120000"]
    }
  }
}
```

Restart Claude Desktop. Each CLI shows up as a typed tool with its full flag set.

## How it works

1. Runs `<command> --help` and captures the output.
2. Parses flags, types, and positionals into a JSON Schema.
3. Starts an MCP stdio server with one tool — your CLI.
4. On each call, builds argv from the AI's input and spawns the subprocess.
5. Returns stdout. Non-zero exits surface as `isError: true`.

Works with any CLI that follows POSIX conventions (`--flag`, `--flag <value>`, positional args).

## Limitations

- **Subcommand trees** (`git commit`, `docker run`) are best-effort — only the top-level `--help` is parsed.
- **Interactive CLIs** that prompt for input after startup are not supported.
- **Streamable HTTP** transport is not yet supported — stdio only.

## License

MIT © 2026 Ronie Neubauer.
