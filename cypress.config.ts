import { defineConfig } from 'cypress'
import { startBasePathServer, stopBasePathServer } from './cypress/basePathServer'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3041',
    chromeWebSecurity: false,
    specPattern: 'cypress/e2e/**/*.spec.*',
    supportFile: false,
    setupNodeEvents(on) {
      on('after:run', () => stopBasePathServer())
      on('task', {
        startBasePathServer,
        stopBasePathServer,
      })
    },
  },
})
