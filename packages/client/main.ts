/// <reference types="@slidev/types/client" />

import { createApp } from 'vue'
import App from './App.vue'
import setupMain from './setup/main'

async function main() {
  const app = createApp(App)
  await setupMain(app)
  app.mount('#app')
}

main()
