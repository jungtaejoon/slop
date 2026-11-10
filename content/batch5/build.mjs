// Build Slopfall: concatenate slopfall/*.js into one self-contained HTML file (KO + EN).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const dir = new URL('./slopfall/', import.meta.url);
const head = readFileSync(new URL('head.html', dir), 'utf8');
const js = readdirSync(dir).filter((f) => f.endsWith('.js')).sort().map((f) => readFileSync(new URL(f, dir), 'utf8')).join('\n');
const ko = head.replace('/*SCRIPT*/', () => js);
if (ko.includes('</script>') && ko.split('</script>').length !== 2) throw new Error('stray </script>');
writeFileSync(new URL('./slopfall.html', import.meta.url), ko);
const en = ko.replace("const LANG = 'ko';", "const LANG = 'en';").replace('<html lang="ko">', '<html lang="en">').replace('<title>슬롭폴</title>', '<title>Slopfall</title>');
writeFileSync(new URL('./slopfall.en.html', import.meta.url), en);
console.log('built', (ko.length / 1024).toFixed(1) + ' KB');
