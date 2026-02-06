import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../modules/nav/HomeView.vue'
import PromptsView from '../modules/prompts/PromptsView.vue'

export const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { title: '工具导航' } },
    { path: '/prompts', name: 'prompts', component: PromptsView, meta: { title: '开发提示词' } },
  ],
})

router.afterEach((to) => {
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 工具导航`
  }
})
