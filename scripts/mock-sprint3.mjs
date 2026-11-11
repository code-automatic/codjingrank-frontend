import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

// Cross-platform equivalent of setting the demo environment in PowerShell.
const child = spawn(
  process.execPath,
  [fileURLToPath(new URL("./mock.mjs", import.meta.url))],
  {
    stdio: "inherit",
    env: { ...process.env, MOCK_SUBMISSION_DEMO: "1", MOCK_EDITOR_DEMO: "1" },
  },
);
child.on("error", () => {
  console.error("Không khởi động được mock Sprint 3.");
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
