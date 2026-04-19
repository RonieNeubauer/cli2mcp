# Contributing to cli2mcp

Thanks for considering a contribution. `cli2mcp` is a small, focused tool — the bar for new code is high, but the bar for **bug reports, fixtures, and docs improvements is low**. Those are the contributions with the highest leverage.

## Highest-leverage contributions

1. **A failing-CLI fixture.** If `cli2mcp <some-cli>` produces a wrong or empty schema for a real CLI, open an issue with:
   - The exact command you ran.
   - The output of `<some-cli> --help` (full, not trimmed) attached as a code block or file.
   - Your OS and the CLI's version.
   This unblocks the parser fix and lets us add a regression test.
2. **A new fixture in `test/fixtures/help/<cli>.txt`** plus a shape-extraction test in `test/parser/shape.test.ts`. Even without a fix, a captured fixture is valuable.
3. **A README config snippet** for an MCP client we don't list yet (Zed, Continue, etc.).
4. **A real-world success story** — open a Discussion telling us which CLI you wrapped and what for. We use these to prioritize fixtures.

## Development setup

Requires Node.js 22+ and `pnpm`.

```sh
git clone https://github.com/RonieNeubauer/cli2mcp.git
cd cli2mcp
pnpm install
pnpm test         # vitest run
pnpm typecheck    # tsc --noEmit
pnpm lint         # biome check
pnpm build        # tsup → dist/index.js
```

All four must be green before you open a PR. CI runs the same matrix on Linux, macOS, and Windows × Node 22 and 24.

## Project shape (please preserve)

- **Single package.** No workspaces, no monorepo split.
- **Runtime dependencies are capped at 5.** Today: `@modelcontextprotocol/sdk`, `commander`, `execa`. Adding a fourth requires a justification in the PR description.
- **`src/parser/` is the only place that spawns the target CLI with `--help`.**
- **`src/server.ts` is the only place that instantiates the MCP SDK `Server`.**
- No global state. Pass config through function arguments.
- No `any`, `@ts-ignore`, `@ts-nocheck`. Strict TypeScript only.

If your change requires breaking one of these, open an issue first to discuss.

## Commit messages

Conventional Commits, one logical change per commit:

- `feat:` — user-visible feature
- `fix:` — bug fix
- `docs:` — documentation only
- `test:` — tests only
- `refactor:` — internal restructuring with no behavior change
- `chore:` — tooling, deps, configs
- `ci:` — CI config

Example: `fix(parser): handle --flag=value form in help output`.

## Pull request checklist

- [ ] Tests added or updated for the changed behavior.
- [ ] `pnpm test`, `pnpm typecheck`, `pnpm lint` all pass.
- [ ] If the change affects the public CLI surface, `README.md` is updated.
- [ ] Commit messages follow Conventional Commits.
- [ ] No new runtime dependency (or one is justified in the PR description).

## Code of Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). Be kind. Be specific. Disagreement is fine; disrespect is not.

## Reporting security issues

See [SECURITY.md](./SECURITY.md). Do **not** open a public issue for security reports.
