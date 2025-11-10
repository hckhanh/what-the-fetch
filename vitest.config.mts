import codspeed from '@codspeed/vitest-plugin'
import {
  coverageConfigDefaults,
  defaultExclude,
  defineConfig,
} from 'vitest/config'

export default defineConfig({
  plugins: [codspeed()],
  test: {
    exclude: [...defaultExclude, 'tsdown.config.*'],
    coverage: {
      exclude: [...coverageConfigDefaults.exclude, 'tsdown.config.*'],
    },

    clearMocks: true,
    unstubGlobals: true,
  },
})
