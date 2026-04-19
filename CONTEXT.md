# mcp-wrap — session pickup brief

> **Read this first when starting a cold session in this repo.**

## Status

- **In progress.** Phases 0–2 complete; Phase 3 started — task 3.1 (toInputSchema) done as of 2026-04-18.
- **Owner:** Ronie Neubauer (solo, 22+ yr senior eng).
- **Sister project:** `skillforge/` at `D:\Projetos\skillforge` — built in parallel, independent codebase.
- **Parent working dir (legacy):** `D:\Projetos\prompt-attack` — abandoned MCP Inspect project; do not use.

## Elevator pitch

`mcp-wrap <command>` wraps any CLI binary as an MCP stdio server in one line. Input schema is inferred from the target CLI's `--help` output. Example:

```
npx mcp-wrap jq
# jq is now callable as an MCP tool from Claude/Cursor/Gemini CLI
```

## Why this exists (pivot history)

1. **AgentSec Arena** (prompt-attack/adversarial testing) — deleted 2026-04-18 after assessment said AI-security tooling was saturated (Garak, PyRIT, Lakera). *That assessment was partially wrong — indie CLI red-team still has room. Do not revive without re-reading that audit.*
2. **MCP Inspect** (full DX kit for MCP servers) — specced and planned at `D:\Projetos\prompt-attack` on 2026-04-18; abandoned same day after audit found 8+ competitors already shipping (official `@modelcontextprotocol/inspector`, `mcp-recorder`, `mcpscope`, AIMock, MCPBench, Docker MCP Inspector, etc.) and positioning "first DX kit" was false.
3. **mcp-wrap** + **skillforge** (this project) — narrower, faster-to-ship, no direct competitor as of April 2026. Ship both in parallel, kill the one that doesn't hit traction.

## Operating model

- **Claude = sole executor** (decision 2026-04-18: dropped Codex, consolidated on Claude Max 5x).
- Each session: pick next unchecked task in `TASKS.md`, TDD it via `superpowers` skills, verify green, commit.
- `CODEX.md` retained as historical reference only.
- Both projects (mcp-wrap, skillforge) run independent git repos, no shared workspace.

## Kill criteria (strict)

| Milestone | Threshold | Action |
|---|---|---|
| Week 1 post-launch | <50 ★ | inspect demo / positioning |
| Week 2 | <200 ★ | pivot to skillforge focus |
| Week 4 | <500 ★ | kill, pivot again |
| Week 4 | >500 ★ | double down (transports, blog, tutorials) |

## Next 3 actions (in order)

1. Codex executes `TASKS.md` Phase 0 (scaffold) — ~2h.
2. Claude reviews after Phase 0 + Phase 1 commits land.
3. Launch target: **7 days** from first Codex commit.

## Files in this repo

| File | Purpose |
|---|---|
| `CONTEXT.md` | this — read first on cold session |
| `README.md` | public pitch (npm + GitHub) |
| `SPEC.md` | design + architecture |
| `TASKS.md` | granular task list for Codex |
| `CODEX.md` | operating rules for Codex executor |
| `CLAUDE.md` | rules for Claude sessions in this repo |

## User profile (apply to any work in this repo)

- 22+ years engineering, top technical roles. Not new to anything technical.
- Focus: **money + visibility**, not intellectual attachment. Will pivot fast if signal is bad.
- Brutal honesty preferred. Numeric grades when asked. No hedging.
- English only in code, commits, docs, UI. Portuguese OK in chat.
- Workflow: Claude + Codex + GPT in parallel. Does not wait on a single agent.

## Known prior feedback (memories are in the LEGACY prompt-attack session — not auto-loaded here)

- **Do not unilaterally cut scope:** if user explicitly says "do all of them", register trade-off once, then execute full scope.
- **Do not flip pivot recommendations across sessions:** read prior context before suggesting a pivot. Star-ceiling numbers are noisy within 3x; don't oversell.

## Reference: key market facts (April 2026)

- MCP spec current: **2025-11-25**. SDK current: **@modelcontextprotocol/sdk@1.29.0** (v2 expected Q1-Q2 2026).
- SSE transport: **deprecated since 2025-03-26**, Streamable HTTP is the forward path.
- MCP donated to Linux Foundation (Agentic AI Foundation) Dec 2025.
- Node 24 LTS since April 2026. This project uses Node 22+ as minimum.
- pnpm 10.x, Biome 2.4, Vite 8, React 19 are current.
- OpenAPI → MCP generators: **saturated** (7 competitors). Do not build that.
- Closest neighbor to mcp-wrap: FastMCP's `from_openapi` method. Does NOT cover "wrap an arbitrary CLI binary" — that's this project's lane.
