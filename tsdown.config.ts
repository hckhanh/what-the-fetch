import { defineConfig } from 'tsdown'

export default defineConfig({
  platform: 'neutral',
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: 'esm',
  unbundle: true,
  dts: true,
  exports: true,
})
