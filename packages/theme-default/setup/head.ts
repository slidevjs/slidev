import { useHead } from '@vueuse/head'

export default function setupHead() {
  useHead({
    title: 'Slidev',
    link: [
      { rel: 'dns-prefetch', href: 'https://fonts.gstatic.com' },
      { rel: 'preconnect', crossorigin: 'anonymous', href: 'https://fonts.gstatic.com' },
      { href: 'https://fonts.googleapis.com/css2?family=Fira+Code&family=Nunito+Sans:wght@200;400;600', rel: 'stylesheet' },
    ],
  })
}
