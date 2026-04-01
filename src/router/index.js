import { createRouter, createWebHashHistory } from 'vue-router'

const loadHomeView = () => import('../modules/nav/HomeView.vue')
const loadPromptsView = () => import('../modules/prompts/PromptsView.vue')
const loadSqlView = () => import('../modules/sql/SqlTemplatesView.vue')

const routeComponentLoaders = {
  home: loadHomeView,
  prompts: loadPromptsView,
  sql: loadSqlView,
}

export const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: loadHomeView,
      meta: { title: '工具导航' },
    },
    {
      path: '/prompts',
      name: 'prompts',
      component: loadPromptsView,
      meta: { title: '开发提示词' },
    },
    {
      path: '/sql',
      name: 'sql',
      component: loadSqlView,
      meta: { title: 'SQL 模板' },
    },
  ],
})

export async function preloadRouteComponents(names = []) {
  const tasks = names
    .map((name) => routeComponentLoaders[name])
    .filter(Boolean)
    .map((loader) => loader().catch(() => null))
  await Promise.all(tasks)
}

router.afterEach((to) => {
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 工具导航`
  }
})
