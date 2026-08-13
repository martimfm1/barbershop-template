import { execFileSync } from "node:child_process";

const args = ["audit", "--prod", "--audit-level=high"];
console.log(`Running pnpm ${args.join(" ")}`);

try {
  execFileSync("pnpm", args, { stdio: "inherit" });
} catch {
  console.error(
    "Dependency audit failed. Resolve high/critical production vulnerabilities before release.",
  );
  process.exit(1);
}
