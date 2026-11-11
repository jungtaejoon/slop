// Regenerates the Android (Trusted Web Activity) project in this folder from the
// live web app manifest. Run: node android/generate.mjs (needs ~/.bubblewrap/cli).
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
const require = createRequire(`${homedir()}/.bubblewrap/cli/node_modules/`);
const { TwaManifest, TwaGenerator, ConsoleLog } = require('@bubblewrap/core');

const twa = await TwaManifest.fromWebManifest('https://slop.ai.kr/manifest.webmanifest');
Object.assign(twa, {
  packageId: 'io.github.jungtaejoon.slop',
  host: 'slop.ai.kr',
  name: 'Slop',
  launcherName: 'Slop',
  startUrl: '/slop/#/',
  fallbackType: 'customtabs',
  enableNotifications: false,
  appVersionName: '1.0.0',
  appVersionCode: 1,
  minSdkVersion: 24, // androidbrowserhelper 2.7+ needs Android 7.0+
  signingKey: { path: `${homedir()}/.slop-android/upload-key.jks`, alias: 'upload' },
});
await twa.saveToFile('android/twa-manifest.json');
await new TwaGenerator().createTwaProject('android', twa, new ConsoleLog('generate'));
console.log('Android project generated in android/');
