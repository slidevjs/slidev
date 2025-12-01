import type { LoadedSlidevData } from '@slidev/parser/fs'
import { basename } from 'node:path'

export function getSlidesTitle(data: LoadedSlidevData): string | undefined {
  // If the title is set via headmatter, it has already been the first slide's title
  return data.slides[0].title || basename(data.entry.filepath)
}
