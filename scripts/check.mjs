import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const binary = (name) => join(root, "node_modules", ".bin", name);
const startedAt = new Date();
const startedMs = Date.now();

function run(name, command, args) {
  console.log(`\n› ${name}`);
  const result = spawnSync(command, args, {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  });
  return result.status ?? 1;
}

const gitFiles = spawnSync("git", ["ls-files", "-z"], {
  cwd: root,
  encoding: "utf8",
});

if (gitFiles.status !== 0) {
  process.stderr.write("Unable to list tracked files with git ls-files.\n");
  process.exit(gitFiles.status ?? 1);
}

const tracked = gitFiles.stdout.split("\0").filter(Boolean);
const prettierFiles = tracked.filter((file) =>
  /\.(?:[cm]?[jt]sx?|jsonc?|mdx?|css|ya?ml)$/i.test(file),
);
const eslintFiles = tracked.filter((file) => /\.(?:[cm]?[jt]sx?)$/i.test(file));
const outcomes = [];

function record(name, action) {
  const stepStarted = Date.now();
  const exitCode = action();
  outcomes.push({
    name,
    status: exitCode === 0 ? "green" : "red",
    durationMs: Date.now() - stepStarted,
  });
}

record("format", () =>
  prettierFiles.length
    ? run("format", binary("prettier"), ["--check", "--", ...prettierFiles])
    : 0,
);
record("lint", () =>
  eslintFiles.length ? run("lint", binary("eslint"), eslintFiles) : 0,
);
record("types", () => {
  const typegen = run("generate Next.js route types", binary("next"), [
    "typegen",
  ]);
  const types = run("types", binary("tsc"), ["--noEmit"]);
  return typegen === 0 ? types : typegen;
});
record("tests", () => run("tests", binary("vitest"), ["run"]));

const finishedAt = new Date();
const status = outcomes.every((outcome) => outcome.status === "green")
  ? "green"
  : "red";
const result = {
  status,
  startedAt: startedAt.toISOString(),
  finishedAt: finishedAt.toISOString(),
  durationMs: Date.now() - startedMs,
  steps: outcomes,
};

writeFileSync(
  join(root, ".check-status.json"),
  `${JSON.stringify(result, null, 2)}\n`,
);
console.log(`\nCheck ${status} in ${result.durationMs} ms.`);
if (status !== "green") {
  process.exitCode = 1;
}
