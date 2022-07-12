import { useData,  } from 'vitepress'

export function joinPath(base: string, path: string): string {
  return `${base}${path}`.replace(/\/+/g, '/')
}

export function useUrl() {
  const {site} = useData()

  function withBase(path: string): string {
    if (!path)
      return ''
    return joinPath(site.value.base, path)
  }

  return {
    withBase,
  }
}
