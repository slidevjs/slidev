import type { EnhanceAppContext } from 'vitepress'
import TwoSlash from '@shikijs/vitepress-twoslash/client'
import Theme from 'vitepress/theme'
import Layout from './components/Layout.vue'

import '@shikijs/vitepress-twoslash/style.css'
import './styles/vars.css'
import './styles/demo.css'
import './styles/custom.css'
import 'uno.css'

export default {
  extends: Theme,
  enhanceApp({ app }: EnhanceAppContext) {
    app.use(TwoSlash as any)
  },
  Layout,
}
