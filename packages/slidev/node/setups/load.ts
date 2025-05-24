import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { isObject } from '@antfu/utils'

export async function loadSetups<T>(roots: string[], name: string, defaults: T[]): Promise<T[]> {
  const result = [...defaults]

  for (const root of roots) {
    const path = resolve(root, 'setup', name)
    if (!existsSync(path))
      continue

    try {
      const { default: setup } = await import(pathToFileURL(path).href)
      if (isObject(setup))
        result.push(setup as T)
    }
    catch (e) {
      console.error(`Failed to load setup file "${path}"`)
      console.error(e)
    }
  }

  return result
}