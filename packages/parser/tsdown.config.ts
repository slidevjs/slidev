import { defineConfig } from 'tsdown'
import baseConfig from '../../tsdown.config.ts'

export default defineConfig({
  ...baseConfig,
  entry: {
    index: 'src/index.ts',
    core: 'src/core.ts',
    fs: 'src/fs.ts',
    utils: 'src/utils.ts',
  },
})
