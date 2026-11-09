import { defineConfig } from 'vite';

// Relative base so the build works at a domain root or under a sub-path
// (e.g. GitHub Pages). Routing is hash-based, so no server rewrites are needed.
export default defineConfig({ base: './', build: { outDir: 'dist', target: 'es2022' } });
