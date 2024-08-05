import type { SlideInfo, SourceSlideInfo } from '@slidev/types'
import { computed, reactive } from 'vue'

export interface SlideSource {
  frontmatter: Record<string, string>
  content: string
  note: string
}

export const slidesSource = reactive<SlideSource[]>([
  {
    frontmatter: {},
    content: '# Hello',
    note: '',
  },
])

export const slidesSourcesInfo = computed<SourceSlideInfo[]>(() => slidesSource.map(
  (s, i) => ({
    frontmatter: s.frontmatter,
    content: s.content,
    filepath: `/slides.md__slidev_${i}.md`,
    index: i,
    start: 0,
    contentStart: 0,
    end: 0,
    raw: '',
  } satisfies SourceSlideInfo),
))

export const slidesInfo = computed<SlideInfo[]>(() => slidesSourcesInfo.value.map(
  (s, i) => ({
    frontmatter: s.frontmatter,
    content: s.content,
    index: i,
    source: s,
  } satisfies SlideInfo),
))
