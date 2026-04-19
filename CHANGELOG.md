# Changelog

All notable changes to `cli2mcp` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.3] - 2026-04-19

### Changed
- **Honest client coverage.** The previous tagline named only Claude, Cursor, Cline, and Windsurf; that was SEO-driven framing and misrepresented the project. `cli2mcp` speaks the MCP stdio transport, so it works with any compliant client. README hero paragraph and `package.json` description now say "any MCP-compatible client" and explicitly mention ChatGPT (via OpenAI Agents SDK) and Gemini.
- README "Other clients" table adds rows for ChatGPT, Continue, and Zed.
- npm `keywords` add `chatgpt`, `openai`, `gemini`, `continue`, `zed`.

> Note: 0.1.2 was tagged on GitHub but never reached npm. 0.1.3 is the first npm-published release in the 0.1.x line that includes the community-files batch and the broadened client framing.

## [0.1.2] - 2026-04-19

### Added
- `SECURITY.md` with private vulnerability reporting policy and threat model.
- `CONTRIBUTING.md` with development setup, project invariants, and PR checklist.
- `CHANGELOG.md` (this file).
- GitHub issue templates for bug reports, feature requests, and "CLI not parsing".
- Pull request template.
- `.github/FUNDING.yml`.
- README: comparison table vs hand-written MCP servers, expanded "Quick wins" with five ready-to-paste configs, Star History badge, author/contact section.

### Changed
- `package.json` description and keywords expanded for npm search discoverability — now mentions ChatGPT, Gemini, and "any MCP-compatible client" instead of artificially limiting to four named hosts.
- README clarifies up-front that any stdio-capable MCP client works (Continue, Zed, ChatGPT via OpenAI Agents SDK added to the client table).

## [0.1.1] - 2026-04-18

### Changed
- Repository and binary identifiers aligned to `cli2mcp` (renamed from `mcp-wrap`).
- README rewritten for breadth: schema mapping table, multi-OS config paths, security guidance, troubleshooting.
- Added `docs/demo.svg`.

## [0.1.0] - 2026-04-18

### Added
- Initial public release.
- `cli2mcp <command>` boots a stdio MCP server that wraps any CLI binary.
- JSON Schema synthesis from `--help` output (boolean / string / number / choice / repeatable / positionals / `stdin` piping).
- Options: `--name`, `--description`, `--timeout`, `--cwd`, `--env`, `--stderr {include|drop|error}`.
- Test suite with fixtures for `jq`, `ripgrep`, `curl`, and an end-to-end integration test wrapping `node`.
- GitHub Actions CI matrix: Linux / macOS / Windows × Node 22 and 24.

[Unreleased]: https://github.com/RonieNeubauer/cli2mcp/compare/v0.1.3...HEAD
[0.1.3]: https://github.com/RonieNeubauer/cli2mcp/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/RonieNeubauer/cli2mcp/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/RonieNeubauer/cli2mcp/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/RonieNeubauer/cli2mcp/releases/tag/v0.1.0
