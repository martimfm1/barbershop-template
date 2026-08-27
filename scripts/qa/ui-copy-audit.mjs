import { readFile } from 'node:fs/promises';
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOTS = ['app', 'components', 'context'];
const EXTENSIONS = new Set(['.tsx', '.ts', '.jsx', '.js']);

// These terms are useful internally but should almost never be exposed in the
// normal product UI. The audit looks only at quoted user-facing strings.
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

const TECHNICAL_PATHS = [
  '/api/',
  '/lib/',
  '/scripts/',
  '/supabase/',
  '/services/',
  '/docs/',
];

const USER_STRING = /(['"`])([\s\S]*?)\1/g;

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (EXTENSIONS.has(entry.name.slice(entry.name.lastIndexOf('.')))) files.push(path);
  }

  return files;
}

const files = [];
for (const root of ROOTS) files.push(...(await walk(root)));

const findings = [];
for (const file of files) {
  const relativePath = `/${relative('.', file).replaceAll('\\', '/')}`;
  if (TECHNICAL_PATHS.some((path) => relativePath.includes(path))) continue;

  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(USER_STRING)) {
    const value = match[2];
    if (value.length < 4 || !/[A-Za-zÀ-ÿ]/.test(value)) continue;

    const rule = FORBIDDEN.find((pattern) => pattern.test(value));
    if (!rule) continue;

    const line = source.slice(0, match.index).split('\n').length;
    findings.push(`${relativePath}:${line}: ${value.trim()}`);
  }
}

if (findings.length) {
  console.error('UI copy audit found technical language in user-facing source:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log('UI copy audit passed: no blocked technical language found in user-facing source.');
