// set-env.js
const fs = require('fs');
const path = require('path');

const isProd = process.env.NODE_ENV === 'production';

const targetPath = isProd
  ? path.join(__dirname, './src/environments/environment.prod.ts')
  : path.join(__dirname, './src/environments/environment.ts');

const envConfigFile = `
export const environment = {
  production: ${isProd},
  SUPABASE_URL: '${process.env.SUPABASE_URL || ''}',
  SUPABASE_ANON_KEY: '${process.env.SUPABASE_ANON_KEY || ''}',
};
`;

fs.writeFileSync(targetPath, envConfigFile);
console.log(`✅ Environment file generated at ${targetPath}`);
