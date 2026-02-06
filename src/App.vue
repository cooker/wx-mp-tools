<script setup>
import { computed } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import { navConfig } from './config/nav.config.js'
import { promptConfig } from './config/prompt.config.js'

const route = useRoute()
const { site } = navConfig

const showPromptsLink = computed(() => Boolean(promptConfig?.enabled))

const isHome = computed(() => route.name === 'home')
const isPrompts = computed(() => route.name === 'prompts')
</script>

<template>
  <header class="header">
    <div class="header__inner">
      <h1 class="header__title">
        <router-link to="/" class="header__title-link">{{ site.title }}</router-link>
      </h1>
      <nav v-if="showPromptsLink" class="header__nav" aria-label="主导航">
        <router-link
          to="/"
          class="header__nav-link"
          :class="{ 'header__nav-link--active': isHome }"
        >
          工具
        </router-link>
        <router-link
          to="/prompts"
          class="header__nav-link"
          :class="{ 'header__nav-link--active': isPrompts }"
        >
          提示词
        </router-link>
      </nav>
    </div>
    <p v-if="isHome && site.description" class="header__desc">{{ site.description }}</p>
  </header>

  <main class="main">
    <RouterView v-slot="{ Component }">
      <component :is="Component" />
    </RouterView>
  </main>

  <footer class="footer">
    <p>编辑 <code>src/config/nav.config.js</code>、<code>src/config/prompt.config.js</code> 快速配置</p>
  </footer>
</template>

<style scoped>
.header {
  margin-bottom: 1.5rem;
  animation: fadeIn 0.4s var(--transition-slow) both;
}

.header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.header__title {
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0;
  color: var(--text);
}

.header__title-link {
  color: inherit;
  text-decoration: none;
  transition: color var(--transition);
}
.header__title-link:hover {
  color: var(--accent);
}

.header__nav {
  display: flex;
  gap: 0.25rem;
}

.header__nav-link {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-muted);
  border-radius: var(--radius);
  transition: color var(--transition), background var(--transition);
}
.header__nav-link:hover {
  color: var(--text);
  background: var(--hover-overlay);
}
.header__nav-link--active {
  color: var(--accent);
  background: var(--hover-overlay);
}

.header__desc {
  font-size: 1rem;
  color: var(--text-muted);
  max-width: 36ch;
  line-height: 1.6;
  margin-top: 0.5rem;
  margin-bottom: 0;
}

.main {
  min-height: 40vh;
}

.footer {
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-subtle);
  font-size: 0.85rem;
  color: var(--text-muted);
}

.footer code {
  font-family: var(--font-mono);
  font-size: 0.9em;
  padding: 0.15em 0.4em;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .header {
    animation: none;
  }
}
</style>
