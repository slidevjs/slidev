import { h, shallowRef } from 'vue'
import type { SlideRoute } from '@slidev/types'

const FakeComponent = {
  render: () => h('div', 'FakeComponent'),
}

export const slides = shallowRef<SlideRoute[]>([
  {
    no: 1,
    meta: {
      slide: {
        index: 0,
        frontmatter: {},
        content: '# Hello',
        noteHTML: '',
        filepath: '/slides.md',
        start: 0,
        id: 0,
        no: 1,
      },
      __clicksContext: null,
    },
    load: async () => ({ default: FakeComponent }),
    component: FakeComponent,
  },
])
