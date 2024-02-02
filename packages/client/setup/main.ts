/* __imports__ */

import type { AppContext } from '@slidev/types'
import { MotionPlugin } from '@vueuse/motion'
import TwoSlashFloatingVue from '@shikijs/vitepress-twoslash/client'

export default function setupMain(context: AppContext) {
  function setMaxHeight() {
    // disable the mobile navbar scroll
    // see https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
  }
  setMaxHeight()
  window.addEventListener('resize', setMaxHeight)

  context.app.use(MotionPlugin)
  context.app.use(TwoSlashFloatingVue as any)

  // @ts-expect-error inject in runtime
  // eslint-disable-next-line unused-imports/no-unused-vars
  const injection_arg = context

  /* __injections__ */
}
