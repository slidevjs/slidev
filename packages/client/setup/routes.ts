import type { RouteLocationNormalized, RouteRecordRaw } from 'vue-router'
import configs from '#slidev/configs'
import setups from '#slidev/setups/routes'

export default function setupRoutes() {
  const routes: RouteRecordRaw[] = []

  if (__SLIDEV_FEATURE_PRESENTER__) {
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

    routes.push(
      {
        name: 'entry',
        path: '/entry',
        component: () => import('../pages/entry.vue'),
      },
      {
        name: 'overview',
        path: '/overview',
        component: () => import('../pages/overview.vue'),
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

  if (__SLIDEV_HAS_SERVER__) {
    routes.push(
      {
        name: 'print',
        path: '/print/:no',
        component: () => import('../pages/print.vue'),
      },
      {
        path: '/print',
        redirect: { path: '/print/1' },
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
  )

  return setups.reduce((routes, setup) => setup(routes), routes)
}
