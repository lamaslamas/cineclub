import { readFile, writeFile } from 'node:fs/promises';
const source = await readFile(new URL('./dist/index.html', import.meta.url), 'utf8');
await writeFile(new URL('./index.html', import.meta.url), source.replace('<head>', '<head><base href="./dist/">'));
console.log('GitHub Pages: index.html pronto (asset in dist/).');
