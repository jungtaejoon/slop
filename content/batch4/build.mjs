// Build Inkscar: concatenate inkscar/*.js into one self-contained HTML file (KO + EN).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const dir = new URL('./inkscar/', import.meta.url);
const head = readFileSync(new URL('head.html', dir), 'utf8');
const js = readdirSync(dir).filter((f) => f.endsWith('.js')).sort().map((f) => readFileSync(new URL(f, dir), 'utf8')).join('\n');
const ko = head.replace('/*SCRIPT*/', () => js);
if (ko.includes('</script>') && ko.split('</script>').length !== 2) throw new Error('stray </script>');
writeFileSync(new URL('./inkscar.html', import.meta.url), ko);
const en = ko.replace("const LANG = 'ko';", "const LANG = 'en';").replace('<html lang="ko">', '<html lang="en">').replace('<title>묵흔: 마지막 필경사</title>', '<title>Inkscar: The Last Scribe</title>');
writeFileSync(new URL('./inkscar.en.html', import.meta.url), en);
console.log('built', (ko.length / 1024).toFixed(1) + ' KB');
