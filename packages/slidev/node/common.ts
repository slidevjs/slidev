import { promises as fs } from 'fs'
import { join, resolve } from 'path'
import { getClientRoot } from './plugins/options'

export async function getIndexHtml(): Promise<string> {
  const clientRoot = getClientRoot()
  const mainEntry = resolve(clientRoot, 'main.ts')
  return (await fs.readFile(join(clientRoot, 'index.html'), 'utf-8')).replace('__ENTRY__', `/@fs${mainEntry}`)
}
