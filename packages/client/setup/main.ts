/* __imports__ */

import { AppContext } from '@slidev/types'

export default function setupMain(context: AppContext) {
  function setMaxHeight() {
    // disable the mobile navbar scroll
    // see https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
  }
  setMaxHeight()
  window.addEventListener('resize', setMaxHeight)

  // @ts-expect-error
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const injection_arg = context

  /* __injections__ */
}
