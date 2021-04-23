import { useHead } from '@vueuse/head'

/* __imports__ */

export default function setupHead() {
  useHead({
    title: 'Slidev',
    link: [
      { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' },
    ],
  })

  /* __injections__ */
}
