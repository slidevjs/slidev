// import { objectMap } from '@antfu/utils'
import { Component, createBlock, createVNode, defineComponent, withCtx } from 'vue'
import { RouteRecordRaw } from 'vue-router'
// @ts-expect-error
import generatedRoutes from '/@slidev/routes'

export function getRoutes(layouts: Record<string, Component> = {}): RouteRecordRaw[] {
  return [
    { path: '/', redirect: { path: '/0' } },
    ...generatedRoutes.map((i: RouteRecordRaw) => {
      const component = i.component!
      let layoutName = (i.meta?.layout || 'default') as string
      let layout = layouts[layoutName]
      if (!layout) {
        console.warn(`unknown layout name ${layoutName}`)
        layout = layouts.default
        layoutName = 'default'
      }
      i.component = defineComponent({
        name: `layout-${layoutName}`,
        render: () => createBlock(layout, null, { default: withCtx(() => [createVNode(component)]), _: 1 }),
        // @ts-expect-error
        __file: layout.__file,
      })
      return i
    }),
    {
      path: `/${generatedRoutes.length}`,
      component: layouts.end,
      meta: {
        layout: 'end',
      },
    },
  ]
}
