import type { AppContext } from '@slidev/types'
import type { App } from 'vue'
import setups from '#slidev/setups/main'
import TwoSlashFloatingVue from '@shikijs/vitepress-twoslash/client'
import { createHead } from '@unhead/vue'
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import { createVClickDirectives } from '../modules/v-click'
import { createVDragDirective } from '../modules/v-drag'
import { createVMarkDirective } from '../modules/v-mark'
import { createVMotionDirectives } from '../modules/v-motion'
import setupRoutes from '../setup/routes'

import '#slidev/styles'

export default async function setupMain(app: App) {
  function setMaxHeight() {
    // disable the mobile navbar scroll
    // see https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
  }
  setMaxHeight()
  window.addEventListener('resize', setMaxHeight)

  const router = createRouter({
    history: __SLIDEV_HASH_ROUTE__
      ? createWebHashHistory(import.meta.env.BASE_URL)
      : createWebHistory(import.meta.env.BASE_URL),
    routes: setupRoutes(),
  })

  app.use(router)
  app.use(createHead())
  app.use(createVClickDirectives())
  app.use(createVMarkDirective())
  app.use(createVDragDirective())
  app.use(createVMotionDirectives())
  app.use(TwoSlashFloatingVue as any, { container: '#twoslash-container' })

  const context: AppContext = {
    app,
    router,
  }

  for (const setup of setups)
    await setup(context)
}
