import { useSiteData, joinPath } from 'vitepress'

export function useUrl() {
  const site = useSiteData()

  function withBase(path: string): string {
    return joinPath(site.value.base, path)
  }

  return {
    withBase,
  }
}
