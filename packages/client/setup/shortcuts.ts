/* __imports__ */

import { ShortcutOptions } from 'packages/types/src/setups'
import * as nav from '../logic/nav'

export default function setupShortcuts() {
  // @ts-expect-error
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const injection_arg = nav

  // eslint-disable-next-line prefer-const
  let injection_return: Array<ShortcutOptions> = []

  /* __injections__ */

  return injection_return
}
