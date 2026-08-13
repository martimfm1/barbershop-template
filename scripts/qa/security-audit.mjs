import { execFileSync } from "node:child_process";

const patterns = [
  { label: "service role exposta ao cliente", pattern: /NEXT_PUBLIC_[A-Z0-9_]*(SERVICE_ROLE|SECRET)/i },
  { label: "segredo hardcoded", pattern: /(sk_live_|sk_test_|whsec_|xkeysib-|service_role[^\n]*=)/i },
  { label: "console com token/secret", pattern: /console\.(log|info|warn|error)\([^\n]*(secret|token|password|service_role)/i },
];

const files = execFileSync("git", ["ls-files", "*.ts", "*.tsx", "*.js", "*.mjs", "*.sql", "*.env.example"], {
  encoding: "utf8",
})
  .split(/\r?\n/)
  .map((file) => file.trim())
  .filter(Boolean);

const findings = [];

for (const file of files) {
  if (/node_modules|\.next\//.test(file)) continue;
  const source = execFileSync("git", ["show", `HEAD:${file}`], { encoding: "utf8" });
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

console.log(`Static security audit passed (${files.length} tracked source/config files checked).`);
