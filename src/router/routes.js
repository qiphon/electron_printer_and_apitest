const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('pages/IndexPage.vue'),
      },
      {
        path: 'printer',
        component: () => import('pages/PrinterPage.vue'),
      },
      {
        path: 'database',
        component: () => import('pages/DatabasePage.vue'),
      },
      {
        path: 'remote-api',
        component: () => import('pages/RemoteApiPage.vue'),
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('pages/SettingsPage.vue'),
      },
      {
        path: 'print-jobs',
        name: 'print-jobs',
        component: () => import('pages/PrintJobsPage.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
