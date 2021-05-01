import { promises as fs } from 'fs'
import { SlidevMarkdown } from '@slidev/types'
import { parse, stringify } from './core'

export async function load(filepath: string) {
  const markdown = await fs.readFile(filepath, 'utf-8')

  return parse(markdown, filepath)
}

export async function save(data: SlidevMarkdown, filepath?: string) {
  filepath = filepath || data.filepath!

  await fs.writeFile(filepath, stringify(data), 'utf-8')
}
