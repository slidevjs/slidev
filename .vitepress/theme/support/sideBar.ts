import type { DefaultTheme } from '../config'
import {
  isArray,
  ensureSlash,
  ensureStartingSlash,
  removeExtention,
} from '../utils'

export function isSideBarConfig(
  sidebar: DefaultTheme.SideBarConfig | DefaultTheme.MultiSideBarConfig,
): sidebar is DefaultTheme.SideBarConfig {
  return sidebar === false || sidebar === 'auto' || isArray(sidebar)
}

export function isSideBarGroup(
  item: DefaultTheme.SideBarItem,
): item is DefaultTheme.SideBarGroup {
  return (item as DefaultTheme.SideBarGroup).children !== undefined
}

/**
 * Get the `SideBarConfig` from sidebar option. This method will ensure to get
 * correct sidebar config from `MultiSideBarConfig` with various path
 * combinations such as matching `guide/` and `/guide/`. If no matching config
 * was found, it will return `auto` as a fallback.
 */
export function getSideBarConfig(
  sidebar: DefaultTheme.SideBarConfig | DefaultTheme.MultiSideBarConfig,
  path: string,
): DefaultTheme.SideBarConfig {
  if (isSideBarConfig(sidebar))
    return sidebar

  // get the very first segment of the path to compare with nulti sidebar keys
  // and make sure it's surrounded by slash
  path = removeExtention(path)
  path = ensureStartingSlash(path).split('/')[1] || '/'
  path = ensureSlash(path)

  for (const dir of Object.keys(sidebar)) {
    // make sure the multi sidebar key is surrounded by slash too
    if (path === ensureSlash(dir))
      return sidebar[dir]
  }

  return 'auto'
}

/**
 * Get flat sidebar links from the sidebar items. This method is useful for
 * creating the "next and prev link" feature. It will ignore any items that
 * don't have `link` property and removes `.md` or `.html` extension if a
 * link contains it.
 */
export function getFlatSideBarLinks(
  sidebar: DefaultTheme.SideBarItem[],
): DefaultTheme.SideBarLink[] {
  return sidebar.reduce<DefaultTheme.SideBarLink[]>((links, item) => {
    if (item.link)
      links.push({ text: item.text, link: removeExtention(item.link) })

    if (isSideBarGroup(item))
      links = [...links, ...getFlatSideBarLinks(item.children)]

    return links
  }, [])
}
