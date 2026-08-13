import { execFileSync } from "node:child_process";

const sourceFiles = execFileSync(
  "git",
  ["ls-files", "*.ts", "*.tsx", "*.js", "*.mjs", "*.sql"],
  { encoding: "utf8" },
)
  .split(/\r?\n/)
  .map((file) => file.trim())
  .filter(Boolean)
  .filter((file) => !file.startsWith("scripts/qa/"));

const patterns = [
  {
    label: "service role exposta ao cliente",
    pattern: /NEXT_PUBLIC_[A-Z0-9_]*(SERVICE_ROLE|SECRET)/i,
  },
  {
    label: "segredo hardcoded",
    pattern:
      /(?:sk_(?:live|test)_[A-Za-z0-9]+|whsec_[A-Za-z0-9]+|xkeysib-[A-Za-z0-9-]+|service_role\s*:\s*["'`][^"'`\n]+["'`]|service_role\s*=\s*[^\s#]+)/i,
  },
  {
    label: "console com segredo",
    pattern:
      /console\.(?:log|info|warn|error)\([^\n]*(?:secret|service_role|password)\s*[:=]/i,
  },
];

const findings = [];

for (const file of sourceFiles) {
  const source = execFileSync("git", ["show", `HEAD:${file}`], {
    encoding: "utf8",
  });

  for (const item of patterns) {
    if (item.pattern.test(source)) {
      findings.push(`${item.label}: ${file}`);
    }
  }
}

if (findings.length) {
  console.error("Static security audit failed:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(
  `Static security audit passed (${sourceFiles.length} tracked source files checked).`,
);
