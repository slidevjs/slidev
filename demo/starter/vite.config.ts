import Inspect from 'vite-plugin-inspect'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    Inspect({
      dev: true,
    }),
  ],
})
