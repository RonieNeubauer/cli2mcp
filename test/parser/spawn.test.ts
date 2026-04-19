import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("execa", () => ({
  execa: vi.fn(),
}));

const { execa } = await import("execa");
const { captureHelp, NoHelpError } = await import("../../src/parser/spawn.js");

const mockedExeca = execa as unknown as ReturnType<typeof vi.fn>;

describe("captureHelp", () => {
  beforeEach(() => {
    mockedExeca.mockReset();
  });

  test("invokes target with --help using safe execa options", async () => {
    mockedExeca.mockResolvedValue({ stdout: "help", stderr: "", exitCode: 0 });

    await captureHelp("jq");

    expect(mockedExeca).toHaveBeenCalledWith("jq", ["--help"], {
      timeout: 5000,
      reject: false,
    });
  });

  test("merges stdout and stderr (CLIs like jq emit help on stderr)", async () => {
    mockedExeca.mockResolvedValue({
      stdout: "Usage: jq [OPTIONS]",
      stderr: "extra help on stderr",
      exitCode: 0,
    });

    const output = await captureHelp("jq");

    expect(output).toBe("Usage: jq [OPTIONS]\nextra help on stderr");
  });

  test("returns merged output even when exit code is non-zero", async () => {
    mockedExeca.mockResolvedValue({
      stdout: "",
      stderr: "unknown option --help\nusage: foo",
      exitCode: 2,
    });

    const output = await captureHelp("foo");

    expect(output).toBe("\nunknown option --help\nusage: foo");
  });

  test("throws NoHelpError when exit non-zero AND both streams empty", async () => {
    mockedExeca.mockResolvedValue({ stdout: "", stderr: "", exitCode: 1 });

    await expect(captureHelp("ghost-cli")).rejects.toBeInstanceOf(NoHelpError);
    await expect(captureHelp("ghost-cli")).rejects.toThrow(/ghost-cli/);
  });

  test("does not throw when exit is zero even if output is empty", async () => {
    mockedExeca.mockResolvedValue({ stdout: "", stderr: "", exitCode: 0 });

    const output = await captureHelp("silent");

    expect(output).toBe("\n");
  });
});
