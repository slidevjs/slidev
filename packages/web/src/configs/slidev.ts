import { getDefaultConfig } from '@slidev/parser'
import { shallowReactive } from 'vue'

export default shallowReactive<typeof import('#slidev/configs').default>({
  ...getDefaultConfig(),
  slidesTitle: 'TODO',
})
