import type { RouteLocationNormalized, RouteRecordRaw } from 'vue-router'
import configs from '#slidev/configs'
import setups from '#slidev/setups/routes'

export default function setupRoutes() {
  const routes: RouteRecordRaw[] = []

  function passwordGuard(to: RouteLocationNormalized) {
    if (!configs.remote || configs.remote === to.query.password)
      return true
    if (configs.remote && to.query.password === undefined) {
      // eslint-disable-next-line no-alert
      const password = prompt('Enter password')
      if (configs.remote === password)
        return true
    }
    if (to.params.no)
      return { path: `/${to.params.no}` }
    return { path: '' }
  }

  if (__SLIDEV_FEATURE_PRESENTER__) {
    routes.push(
      {
        name: 'entry',
        path: '/entry',
        component: () => import('../pages/entry.vue'),
        beforeEnter: passwordGuard,
      },
      {
        name: 'overview',
        path: '/overview',
        component: () => import('../pages/overview.vue'),
        beforeEnter: passwordGuard,
      },
      {
        name: 'notes',
        path: '/notes',
        component: () => import('../pages/notes.vue'),
        beforeEnter: passwordGuard,
      },
      {
        name: 'notes-edit',
        path: '/notes-edit',
        component: () => import('../pages/notes-edit.vue'),
        beforeEnter: passwordGuard,
      },
      {
        name: 'presenter',
        path: '/presenter/:no',
        component: () => import('../pages/presenter.vue'),
        beforeEnter: passwordGuard,
      },
      {
        path: '/presenter',
        redirect: { path: '/presenter/1' },
      },
    )
  }

  if (__SLIDEV_FEATURE_PRINT__) {
    routes.push(
      {
        name: 'print',
        path: '/print',
        component: () => import('../pages/print.vue'),
        beforeEnter: passwordGuard,
      },
      {
        path: '/presenter/print',
        component: () => import('../pages/presenter/print.vue'),
        beforeEnter: passwordGuard,
      },
    )
  }

  if (__SLIDEV_FEATURE_BROWSER_EXPORTER__) {
    routes.push(
      {
        name: 'export',
        path: '/export/:no?',
        component: () => import('../pages/export.vue'),
        beforeEnter: passwordGuard,
      },
    )
  }

  routes.push(
    {
      name: 'play',
      path: '/:no',
      component: () => import('../pages/play.vue'),
    },
    {
      path: '',
      redirect: { path: '/1' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../pages/404.vue'),
    },
  )

  return setups.reduce((routes, setup) => setup(routes), routes)
}
