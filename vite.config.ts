import { defineConfig } from 'vite'
import { ViteSlides } from './plugins/preset'

export default defineConfig({
  plugins: [
    ViteSlides(),
  ],
})
