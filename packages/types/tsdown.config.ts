import { defineConfig } from 'tsdown'
import { StaleGuardRecorder } from 'tsdown-stale-guard'
import baseConfig from '../../tsdown.config.ts'

export default defineConfig({
  ...baseConfig,
  deps: {
    skipNodeModulesBundle: true,
  },
  plugins: [StaleGuardRecorder()],
})
