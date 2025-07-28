const esbuild = require('esbuild');

esbuild
  .build({
    entryPoints: ['./src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node22.17.1',
    outfile: 'dist/cli.js',
    banner: {
      js: '#!/usr/bin/env node',
    },
    external: ['config.json'],
  })
  .catch(() => process.exit(1));
