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

  // Enable the browser exporter UI only when configured
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

  // Handout/Cover print routes are needed for both the browser exporter
  // and the CLI exporter (print mode). Make them available when either
  // feature is enabled so Playwright can navigate to them during CLI export.
  if (__SLIDEV_FEATURE_BROWSER_EXPORTER__ || __SLIDEV_FEATURE_PRINT__) {
    routes.push(
      {
        name: 'handout',
        path: '/handout',
        component: () => import('../pages/handout/print.vue'),
        beforeEnter: passwordGuard,
      },
      {
        name: 'cover',
        path: '/cover',
        component: () => import('../pages/cover/print.vue'),
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
