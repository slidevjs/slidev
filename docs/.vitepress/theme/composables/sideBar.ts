import { computed } from 'vue-demi'
import { useRoute, useSiteDataByRoute } from 'vitepress'
// import { Header } from '/@types/shared'
import { useActiveSidebarLinks } from '../composables/activeSidebarLink'
import { getSideBarConfig } from '../support/sideBar'
import { DefaultTheme } from '../config'

export function useSideBar() {
  const route = useRoute()
  const site = useSiteDataByRoute()

  useActiveSidebarLinks()

  return computed(() => {
    // at first, we'll check if we can find the sidebar setting in frontmatter.
    const headers = route.data.headers
    const frontSidebar = route.data.frontmatter.sidebar
    const sidebarDepth = route.data.frontmatter.sidebarDepth

    // if it's `false`, we'll just return an empty array here.
    if (frontSidebar === false)
      return []

    // if it's `atuo`, render headers of the current page
    if (frontSidebar === 'auto')
      return resolveAutoSidebar(headers, sidebarDepth)

    // now, there's no sidebar setting at frontmatter; let's see the configs
    const themeSidebar = getSideBarConfig(
      site.value.themeConfig.sidebar,
      route.path,
    )

    if (themeSidebar === false)
      return []

    if (themeSidebar === 'auto')
      return resolveAutoSidebar(headers, sidebarDepth)

    return themeSidebar
  })
}

function resolveAutoSidebar(
  headers: any[],
  depth: number,
): DefaultTheme.SideBarItem[] {
  const ret: DefaultTheme.SideBarItem[] = []

  if (headers === undefined)
    return []

  let lastH2: DefaultTheme.SideBarItem | undefined
  headers.forEach(({ level, title, slug }) => {
    if (level - 1 > depth)
      return

    const item: DefaultTheme.SideBarItem = {
      text: title,
      link: `#${slug}`,
    }
    if (level === 2) {
      lastH2 = item
      ret.push(item)
    }
    else if (lastH2) {
      ((lastH2 as any).children || ((lastH2 as any).children = [])).push(item)
    }
  })

  return ret
}
