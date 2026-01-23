<script setup>
import { navConfig } from './config/nav.config.js'
import CategorySection from './components/CategorySection.vue'

const { site, categories } = navConfig
</script>

<template>
  <header class="header">
    <h1 class="header__title">{{ site.title }}</h1>
    <p v-if="site.description" class="header__desc">{{ site.description }}</p>
  </header>

  <main class="main">
    <CategorySection
      v-for="(cat, index) in categories"
      :key="cat.id"
      :id="cat.id"
      :name="cat.name"
      :icon="cat.icon"
      :items="cat.items"
      :index="index"
    />
  </main>

  <footer class="footer">
    <p>编辑 <code>src/config/nav.config.js</code> 快速配置导航</p>
  </footer>
</template>

<style scoped>
.header {
  margin-bottom: 2.5rem;
  animation: fadeIn 0.5s ease both;
}

.header__title {
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, var(--text) 0%, var(--text-muted) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header__desc {
  font-size: 1rem;
  color: var(--text-muted);
  max-width: 36ch;
}

.main {
  animation: fadeIn 0.5s ease 0.1s both;
}

.footer {
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
  font-size: 0.85rem;
  color: var(--text-muted);
}

.footer code {
  font-family: var(--font-mono);
  font-size: 0.9em;
  padding: 0.15em 0.4em;
  background: var(--bg-card);
  border-radius: 4px;
  border: 1px solid var(--border);
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
</style>
