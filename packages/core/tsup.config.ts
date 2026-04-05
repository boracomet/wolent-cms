import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  // Workspace packages ve Node built-ins external bırak
  external: [
    '@wolent/database',
    '@wolent/utils',
    '@prisma/client',
    // Node built-ins
    'node:crypto',
    'node:path',
    'node:fs',
    'node:fs/promises',
    'node:async_hooks',
    'node:url',
  ],
  noExternal: [],
  treeshake: true,
  target: 'node22',
})
