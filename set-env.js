// set-env.js
const fs = require('fs');
const path = require('path');

const isProd = process.env.NODE_ENV === 'production';

// Define folder + target file
const envDir = path.join(__dirname, './src/environments');
const targetPath = isProd
  ? path.join(envDir, 'environment.prod.ts')
  : path.join(envDir, 'environment.ts');

// ✅ Ensure the environments folder exists
if (!fs.existsSync(envDir)) {
  fs.mkdirSync(envDir, { recursive: true });
  console.log(`Created missing folder: ${envDir}`);
}

// ✅ Write the environment file
const envConfigFile = `
export const environment = {
  SUPABASE_URL: '${process.env.SUPABASE_URL || ''}',
  SUPABASE_ANON_KEY: '${process.env.SUPABASE_ANON_KEY || ''}',
};
`;

fs.writeFileSync(targetPath, envConfigFile);
console.log(`✅ Environment file generated at ${targetPath}`);
