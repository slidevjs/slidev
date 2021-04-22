import { isObject } from '@antfu/utils'
import { Config as WindiCssConfig } from 'windicss/types/interfaces'

function deepMerge(a: any, b: any, rootPath: string) {
  a = { ...a }
  Object.keys(b).forEach((key) => {
    if (isObject(a[key]))
      a[key] = deepMerge(a[key], b[key], rootPath ? `${rootPath}.${key}` : key)
    else if (Array.isArray(a[key]))
      a[key] = [...a[key], ...b[key]]
    else
      a[key] = b[key]
  })
  return a
}

export function mergeWindicssConfig(a: WindiCssConfig, b: WindiCssConfig) {
  return deepMerge(a, b, '')
}
