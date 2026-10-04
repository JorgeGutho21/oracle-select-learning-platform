import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

// Compare known private values in memory. Output only file names and variable names.
const values = [];
for (const file of [
  '.env.local',
  '.env.oracle.local',
  '.env.vercel-preview.local',
  '.env.qa.local',
]) {
  if (!existsSync(file)) continue;
  for (const [key, value] of Object.entries(parseEnv(readFileSync(file, 'utf8')))) {
    if (
      !key.startsWith('NEXT_PUBLIC_') &&
      /SECRET|PASSWORD|PWD|TOKEN|ACCESS_CODE|WALLET_CONTENT/.test(key) &&
      value.length >= 8
    ) {
      values.push({ key, value });
    }
  }
}
if (existsSync('.vercel/cli/auth.json')) {
  const { token } = JSON.parse(readFileSync('.vercel/cli/auth.json', 'utf8'));
  if (typeof token === 'string' && token.length >= 8)
    values.push({ key: 'VERCEL_CLI_TOKEN', value: token });
}
if (values.length === 0) throw new Error('No private values available for a meaningful scan.');
function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? files(target) : [target];
  });
}
const staticHits = [];
for (const file of files('.next/static')) {
  const content = readFileSync(file, 'utf8');
  for (const { key, value } of values) if (content.includes(value)) staticHits.push({ file, key });
}
const repositoryHits = [];
const textFiles = execFileSync(
  'git',
  ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
  {
    encoding: 'utf8',
  },
)
  .split('\0')
  .filter(
    (file) =>
      /\.(?:[cm]?[jt]sx?|json|md|s?css|sql|html|toml|ya?ml|txt)$/.test(file) ||
      ['.env.example', '.gitignore', '.vercelignore', '.gitattributes'].includes(file),
  );
for (const file of textFiles) {
  if (!existsSync(file)) continue;
  const content = readFileSync(file, 'utf8');
  for (const { key, value } of values)
    if (content.includes(value)) repositoryHits.push({ file, key });
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(content)) {
    repositoryHits.push({ file, key: 'PRIVATE_KEY_HEADER' });
  }
}
const history = execFileSync('git', ['log', '-15', '-p', '--no-ext-diff'], {
  encoding: 'utf8',
  maxBuffer: 32 * 1024 * 1024,
});
const recentHistoryHits = values
  .filter(({ value }) => history.includes(value))
  .map(({ key }) => key);
const report = {
  staticHits,
  repositoryHits,
  recentHistoryHits,
  scannedPrivateVariables: values.length,
  historyCommits: 15,
};
mkdirSync('output/playwright/phase5', { recursive: true });
writeFileSync('output/playwright/phase5/secret-scan.json', JSON.stringify(report, null, 2));
console.log(report);
if (staticHits.length || repositoryHits.length || recentHistoryHits.length) process.exitCode = 1;
