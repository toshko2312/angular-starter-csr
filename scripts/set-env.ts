import { writeFileSync } from 'fs';

const targetPath = './src/environments/environment.prod.ts';
const supabaseUrl = process.env['SUPABASE_URL']!;
const supabaseKey = process.env['SUPABASE_KEY']!;

const envConfigFile = `
export const environment = {
  production: true,
  supabaseUrl: '${supabaseUrl}',
  supabaseKey: '${supabaseKey}'
};
`;

writeFileSync(targetPath, envConfigFile);
console.log(`Environment file generated at ${targetPath}`);
