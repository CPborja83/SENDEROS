import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '../public/runtime-config.js');
const serverUrl = String(process.env.VITE_SERVER_URL || '').trim().replace(/\/$/, '');
fs.writeFileSync(out, `window.LajujRuntime = window.LajujRuntime || { serverUrl: ${JSON.stringify(serverUrl)} };\n`);
console.log(serverUrl ? `Runtime backend: ${serverUrl}` : 'Runtime backend: same-origin /ws (local/StackBlitz proxy)');
