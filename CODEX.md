# CODEX operating rules — mcp-wrap

You are the **executor** for this repo. Claude is the planner and reviewer. Respect the role split strictly.

## Scope discipline

- Execute ONLY tasks in `TASKS.md`, in order.
- Do NOT add features outside the current task.
- Do NOT upgrade, downgrade, add, or remove dependencies without explicit instruction.
- If a task is ambiguous, add `HANDOFF: <question>` as a Markdown comment inside the task and stop work.

## Code discipline

- **Tests first** when the task implies behavior. Write a failing test, then implement, then verify green.
- **One task = one commit.** Never combine tasks into a single commit.
- Commit message format: `<type>: <scope> <summary>` (conventional). Types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`, `ci`.
- Run `pnpm test && pnpm typecheck && pnpm lint` before every commit. If red, fix before committing.
- Never use `--no-verify`, `--force`, `--amend`. Always create new commits.
- Never push to remote unless explicitly asked.

## External APIs

- MCP SDK is pinned to `@modelcontextprotocol/sdk@^1.29.0`.
- If a type, function, or class you need is not in that version, HANDOFF.
- When unsure about MCP message shapes, read `node_modules/@modelcontextprotocol/sdk/dist/**/*.d.ts` — do NOT guess.
- The canonical MCP spec for this project is **2025-11-25**. Older spec versions are not supported.

## Stop conditions — HANDOFF and wait

- Test suite red for more than 2 consecutive attempts.
- A single task exceeded 45 minutes of wall time.
- Unknown error on `child_process` / `execa`.
- Windows-specific stdio behavior that doesn't match POSIX (document it, HANDOFF).
- Any destructive action (publish, force-push, branch delete, `rm -rf`).

## Do not touch without instruction

- `package.json` `version` field.
- `LICENSE`.
- Git config, hooks, remotes.
- GitHub Actions workflows (none in v0.1).
- Any file outside `src/`, `test/`, `docs/` unless the task names it.

## Output shape

- Keep functions small (<40 lines).
- Prefer named exports.
- ESM only — no CommonJS interop unless a dep forces it.
- Strict TypeScript: no `any`, no `!` non-null assertions unless a test proves the invariant.
- No comments explaining WHAT code does. Only comments for non-obvious WHY.

## Language

English only in code, comments, commit messages, docs, and any CLI output.

## End-of-session handoff protocol

When the user says "handoff", "stop for today", "end session", or you hit a HANDOFF blocker:

1. **Working tree clean.** All code changes committed. No stray files outside `.gitignore`.
2. **Verify green:** run `pnpm test && pnpm typecheck && pnpm lint`. Record results for the handoff entry. If red, fix or mark in handoff.
3. **Update `CONTEXT.md`** — only the `## Status` section at the top. Replace:
   - Current phase number + name.
   - Last commit hash (first 7 chars) + message.
   - Next task reference (e.g., "Phase 3, Task 3.1").
   - Blocked-on line (or "nothing" if unblocked).
4. **Append a session entry to `HANDOFF.md`** (create file if missing). Format:
   ```markdown
   ## <YYYY-MM-DD HH:MM> — <one-line summary>

   **Commits this session:**
   - `<hash>` <message>
   - ...

   **Test status:** all green / <failing test paths>

   **Questions for Claude:**
   - <question 1, or "none">

   **Assumptions made (not in SPEC.md):**
   - <assumption or "none">

   **Known issues / gotchas:**
   - <issue or "none">

   **Next task:** <phase + task id + title>
   ```
5. **One final commit** with ONLY `CONTEXT.md` + `HANDOFF.md` changes: `chore: session handoff <YYYY-MM-DD>`.
6. **Do NOT** push, tag, publish, or touch any other file after the handoff commit. Stop.

### What Codex must NOT do in the handoff

- Do NOT edit `SPEC.md`, `CLAUDE.md`, `CODEX.md`, `TASKS.md` structure (ticks in TASKS.md are OK).
- Do NOT summarize in chat — all context lives in `HANDOFF.md` for Claude's next window.
- Do NOT skip the handoff commit even if there are "no visible changes" — the log entry is the value.
