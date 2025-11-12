import { defineConfig } from 'tsup'
import { builtinModules } from 'module'
import pkg from './package.json' assert { type: 'json' }
import { execSync } from 'child_process'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  clean: true,
  target: 'node20',
  shims: false,
  outExtension: ({ format }) => (format === 'cjs' ? { js: '.cjs' } : { js: '.js' }),
  external: [
    //    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
    ...builtinModules,
  ],
  async onSuccess() {
    // copy the plain JS wrapper into dist/ for runtime require
    execSync('cp src/zod-v3-wrapper.js dist/zod-v3-wrapper.js')
  },
})
