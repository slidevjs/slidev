/* __imports__ */
import { useHead } from '@vueuse/head'
// @ts-expect-error
import configs from '/@slidev/configs'

export default function setupApp() {
  /* __injections__ */
  useHead({
    title: configs.title ? `${configs.title} - Slidev` : 'Slidev',
  })
}
