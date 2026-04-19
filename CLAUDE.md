# CLAUDE.md — cli2mcp

Project-level guidance for Claude Code sessions in this repo. English only everywhere.

## Project at a glance

- **Public OSS project** under MIT, published to npm as `cli2mcp`, repo on GitHub at `RonieNeubauer/cli2mcp`.
- **Stdio MCP server** that wraps any CLI binary by parsing its `--help` output. Single package, no workspaces.
- Anything you commit lands on a public branch — assume the world reads it.

## Role

Claude is the **sole executor**: plans, writes code, tests, reviews its own diffs. Use the `superpowers` plugin workflow — `brainstorming` → `writing-plans` → `test-driven-development` → `verification-before-completion` — for any non-trivial change.

## Local-only docs (gitignored)

The following live on disk but are NOT committed. Read them at session start for context, edit them locally as you work, but never re-add them to git:

- `CONTEXT.md` — current status, pivot history, kill criteria, market positioning. Read first on cold session.
- `TASKS.md` — granular task list with checkboxes.
- `CODEX.md` — historical operating rules from when Codex was in the loop. Ignore as policy.
- `prompts/` — scratch prompts.

If `CONTEXT.md` or `TASKS.md` is missing locally, ask the user — do not recreate them from inference.

## Session loop

1. Read local `CONTEXT.md` for current status (if present).
2. `rtk git log --oneline -20` to see prior commits.
3. Check local `TASKS.md` for the next unchecked item.
4. Before touching code on a new phase, invoke `superpowers:brainstorming` if scope is unclear, or `superpowers:writing-plans` for multi-step work. Skip both only for single-file, single-commit tasks already fully specified in `TASKS.md`.
5. Implement with `superpowers:test-driven-development` — test first, then code.
6. Before claiming done, run `superpowers:verification-before-completion`: `pnpm test && pnpm typecheck && pnpm lint` — all green, no exceptions.
7. Update local `TASKS.md` (check boxes, add notes) and local `CONTEXT.md` `## Status` section.
8. Commit (conventional commits, one logical change per commit).

## Red flags to self-police

Reject these in your own diffs before committing:

- Tests asserting trivial truths (`expect(true).toBe(true)`, lone `toBeDefined`).
- Dependencies outside `SPEC.md §8`.
- Features not in `TASKS.md` (add to TASKS.md first if justified).
- Files touched outside `src/`, `test/`, `docs/` without reason.
- Non-conventional commit messages.
- `package.json` `version` bumped without a release task.
- `--no-verify`, `--force`, `--amend`.
- Comments explaining WHAT instead of WHY.
- Any `any`, `@ts-ignore`, `@ts-nocheck`.
- Re-tracking gitignored docs (`CONTEXT.md`, `TASKS.md`, `CODEX.md`, `prompts/`, `.claude/`).

## Code shape to preserve

- **Single package.** No workspaces, no monorepo.
- **No HTTP, no React.** stdio MCP server wrapping child processes.
- **Runtime deps ≤ 5.** v0.1 locked to `@modelcontextprotocol/sdk`, `commander`, `execa`. Nothing else.
- **`src/parser/` is the only place** that spawns the target CLI with `--help`.
- **`src/server.ts` is the only place** that instantiates the MCP SDK Server.
- No global state. Pass config through function args.

## Common commands

```sh
pnpm install       # install deps
pnpm dev           # tsup watch
pnpm build         # tsup build → dist/index.js
pnpm test          # vitest run
pnpm typecheck     # tsc --noEmit
pnpm lint          # biome check
pnpm format        # biome format --write
```

Use `rtk` prefix for git/build/test commands to save tokens (see global CLAUDE.md).

## Docs lookup

For `@modelcontextprotocol/sdk`, `execa`, `commander`, `tsup`, `vitest`, `biome` — use the `context7` plugin before coding against unfamiliar APIs. The MCP SDK in particular moves fast; training data may lag.

## Branching & commits

- Solo v0.1 — commits go straight to `main`.
- Conventional commits only (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`, `ci:`).
- One logical change per commit.

## When in doubt

Consult `SPEC.md`. If the answer isn't there, amend `SPEC.md` (short, justified) before changing code.

## Do NOT do

- Do NOT run `npm publish`, `git push`, `git tag` unless user explicitly asks.
- Do NOT introduce files outside `src/`, `test/`, `docs/`, or the root-level project files (README, SPEC, LICENSE, CLAUDE, configs).
- Do NOT commit `CONTEXT.md`, `TASKS.md`, `CODEX.md`, or anything under `.claude/` or `prompts/` — they are gitignored on purpose.
- Do NOT re-litigate scope after user confirmed it.
- Do NOT skip the TDD/verification loop to "save time" — the discipline is the point.
