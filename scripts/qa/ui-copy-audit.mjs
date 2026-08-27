import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const ROOTS = ['app', 'components', 'context'];
const EXTENSIONS = new Set(['.tsx', '.jsx']);

// Terms that should not appear in ordinary user-facing UI copy.
const FORBIDDEN = [
  /\bRPC\b/i,
  /\bendpoint\b/i,
  /\bpayload\b/i,
  /\btenant\b/i,
  /\bwebhook\b/i,
  /\bUUID\b/i,
  /\bstatus code\b/i,
  /\bcron job\b/i,
  /\bdeploy(?:ment)?\b/i,
  /\binfrastructure\b/i,
  /\bhigh-fidelity\b/i,
  /\bfrictionless\b/i,
  /\bcommand center\b/i,
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const filePath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(filePath)));
    else if (EXTENSIONS.has(extname(entry.name))) files.push(filePath);
  }

  return files;
}

const files = [];
for (const root of ROOTS) files.push(...(await walk(root)));

const findings = [];
for (const file of files) {
  const normalizedPath = `/${relative('.', file).replaceAll('\\', '/')}`;

  // Translation sources are reviewed separately; API/server implementation
  // strings are intentionally outside this user-facing audit.
  if (normalizedPath.includes('/locales/')) continue;

  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(/(['"`])([\s\S]*?)\1/g)) {
    const value = match[2].trim();
    if (value.length < 4 || !/[A-Za-zÀ-ÿ]/.test(value)) continue;

    const rule = FORBIDDEN.find((pattern) => pattern.test(value));
    if (!rule) continue;

    const line = source.slice(0, match.index).split('\n').length;
    findings.push(`${normalizedPath}:${line}: ${value}`);
  }
}

if (findings.length) {
  console.error('UI copy audit found technical language in user-facing source:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log('UI copy audit passed: no blocked technical language found in user-facing source.');
