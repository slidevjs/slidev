import { FunctionalComponent, h, VNode } from 'vue-demi'
import { useRoute, useSiteData } from 'vitepress'
import type { DefaultTheme } from '../config'
import { joinUrl, isActive } from '../utils'

export const SideBarLink: FunctionalComponent<{
  item: DefaultTheme.SideBarItem
}> = (props) => {
  const route = useRoute()
  const site = useSiteData()

  const text = props.item.text
  const link = resolveLink(site.value.base, props.item.link)
  const children = (props.item as DefaultTheme.SideBarGroup).children
  const active = isActive(route, link)
  const childItems = renderChildren(children)

  return h('li', { class: 'sidebar-link' }, [
    h(
      link ? 'a' : 'p',
      {
        class: { 'sidebar-link-item': true, active },
        href: link,
      },
      text,
    ),
    childItems,
  ])
}

function resolveLink(base: string, path?: string): string | undefined {
  if (path === undefined)
    return path

  // keep relative hash to the same page
  if (path.startsWith('#'))
    return path

  return joinUrl(base, path)
}

function renderChildren(
  children?: DefaultTheme.SideBarItem[],
): VNode | null {
  if (children && children.length > 0) {
    return h(
      'ul',
      { class: 'sidebar-links' },
      children.map(c => h(SideBarLink, { item: c })),
    )
  }

  return null
}
