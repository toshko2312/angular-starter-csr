// set-env.js
//
// Writes src/environments/environment.ts from the environment. The values land
// verbatim in the browser bundle, so only publishable ones belong here.
//
// Order of precedence: real environment variables (Vercel project settings,
// CI) first, then a local .env file. Missing required values stop the build
// here rather than 20 seconds later, where the symptom is an opaque
// "supabaseUrl is required" from a prerendered route.
const fs = require('fs');
const path = require('path');

const envDir = path.join(__dirname, './src/environments');
const targetPath = path.join(envDir, 'environment.ts');

/** Minimal .env reader: KEY=value per line, # comments, optional quotes. */
function readDotEnv() {
  const file = path.join(__dirname, '.env');
  if (!fs.existsSync(file)) return {};

  const values = {};
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    values[match[1]] = match[2].trim().replace(/^["'](.*)["']$/, '$1');
  }
  return values;
}

const dotEnv = readDotEnv();
const read = (key) => (process.env[key] || dotEnv[key] || '').trim();

const SUPABASE_URL = read('SUPABASE_URL');
const SUPABASE_ANON_KEY = read('SUPABASE_ANON_KEY');
const ADMIN_EMAIL = read('ADMIN_EMAIL');

const missing = [
  ['SUPABASE_URL', SUPABASE_URL],
  ['SUPABASE_ANON_KEY', SUPABASE_ANON_KEY],
]
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length) {
  console.error(
    [
      '',
      `✖ Missing required build variable(s): ${missing.join(', ')}`,
      '',
      '  Locally: copy .env.example to .env and fill them in.',
      '  On Vercel: Project -> Settings -> Environment Variables, then redeploy.',
      '',
      '  Building without them produces a bundle whose Supabase client cannot be',
      '  created, which fails during prerendering with "supabaseUrl is required".',
      '',
    ].join('\n'),
  );
  process.exit(1);
}

if (!ADMIN_EMAIL) {
  console.warn('⚠ ADMIN_EMAIL is empty — the /admin sign-in form will not be able to log in.');
}

fs.mkdirSync(envDir, { recursive: true });

// Deliberately narrow: SUPABASE_DB_PASSWORD lives in .env for the Supabase CLI
// and must never be inlined into a browser bundle.
fs.writeFileSync(
  targetPath,
  `export const environment = {
  SUPABASE_URL: '${SUPABASE_URL}',
  SUPABASE_ANON_KEY: '${SUPABASE_ANON_KEY}',
  ADMIN_EMAIL: '${ADMIN_EMAIL}',
};
`,
);

console.log(`✅ Environment file generated at ${targetPath}`);
