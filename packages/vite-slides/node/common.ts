import { promises as fs } from 'fs'
import { join, resolve } from 'path'

export async function getIndexHtml(): Promise<string> {
  const packageRoot = resolve(__dirname, '..')
  const mainEntry = resolve(packageRoot, 'client/main.ts')
  return (await fs.readFile(join(packageRoot, 'client/index.html'), 'utf-8')).replace('__ENTRY__', `/@fs${mainEntry}`)
}
