/* __imports__ */
import { useHead } from '@vueuse/head'
import { configs } from '../env'
import { initSharedState } from '../state/shared'

export default function setupRoot() {
  // @ts-expect-error injected in runtime
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const injection_arg = undefined

  /* __injections__ */

  const title = configs.titleTemplate.replace('%s', configs.title || 'Slidev')
  useHead({ title })
  initSharedState(title)
}
