# Security Policy

## Supported versions

`cli2mcp` is pre-1.0. Only the latest minor on `main` receives security fixes.

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅        |
| < 0.1   | ❌        |

## Reporting a vulnerability

**Do not open a public GitHub issue for security reports.**

Email: **roniesds@gmail.com** with the subject line `cli2mcp security`.

Please include:

- A description of the issue and the impact you observed.
- Steps to reproduce, ideally with a minimal repro repo or commands.
- The version of `cli2mcp` (`cli2mcp --version`), Node.js version, OS, and the target CLI you were wrapping.
- Whether the issue is already public.

You should receive an acknowledgement within **72 hours**. A fix or coordinated disclosure plan will follow within **14 days** for confirmed issues.

## Threat model — what is and isn't a vulnerability

`cli2mcp` is a thin process supervisor. By design, it lets an MCP client invoke a CLI binary that **you** chose to expose, with arguments that **the client (often an LLM)** chose. The following are **not** vulnerabilities in `cli2mcp`:

- An exposed CLI deletes files, exfiltrates data, or makes outbound network calls. That capability lives in the CLI you exposed; `cli2mcp` is the conduit you opted into. See the README's Security section for guidance on what to expose.
- A prompt-injection attack in the client triggers harmful arguments to an exposed CLI. `cli2mcp` does not sandbox the subprocess.
- The schema generated from `--help` is incomplete or wrong for an unconventional CLI. That's a parser bug — file a regular issue with the offending `--help` output.

The following **are** vulnerabilities and should be reported privately:

- Argument-injection paths where input fields can break out of the intended argv structure.
- Timeout or resource-exhaustion bypasses (`--timeout` ignored, runaway subprocesses).
- Environment-variable or working-directory escapes that ignore the `--env` / `--cwd` configuration.
- Any way for an MCP client to execute code or commands that were **not** the wrapped CLI.

Thank you for helping keep `cli2mcp` users safe.
