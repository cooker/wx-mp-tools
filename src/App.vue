<script setup>
import { navConfig } from './config/nav.config.js'
import CategorySection from './components/CategorySection.vue'
import AdSlot from './components/AdSlot.vue'
import NoticeBoard from './components/NoticeBoard.vue'

const { site, categories, ad = {}, notices = {} } = navConfig
</script>

<template>
  <header class="header">
    <h1 class="header__title">{{ site.title }}</h1>
    <p v-if="site.description" class="header__desc">{{ site.description }}</p>
  </header>

  <div class="layout">
    <main class="bento">
      <CategorySection
        v-for="(cat, index) in categories"
        :key="cat.id"
        :id="cat.id"
        :name="cat.name"
        :icon="cat.icon"
        :items="cat.items"
        :index="index"
        :size="cat.size"
      />
    </main>

    <aside class="sidebar">
      <NoticeBoard :config="notices" />
    </aside>
  </div>

  <AdSlot :config="ad" />

  <footer class="footer">
    <p>编辑 <code>src/config/nav.config.js</code> 快速配置导航</p>
  </footer>
</template>

<style scoped>
.header {
  margin-bottom: 2.5rem;
  animation: fadeIn 0.5s var(--transition-slow) both;
}

.header__title {
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 0.5rem;
  color: var(--text);
}

.header__desc {
  font-size: 1rem;
  color: var(--text-muted);
  max-width: 36ch;
  line-height: 1.6;
}

.layout {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 1.5rem;
  align-items: start;
}

.bento {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  min-width: 0;
  animation: fadeIn 0.5s var(--transition-slow) 0.05s both;
}

.bento :deep(.category--sm) {
  grid-column: span 1;
}

.bento :deep(.category--md) {
  grid-column: span 1;
}

.bento :deep(.category--lg) {
  grid-column: span 2;
}

.sidebar {
  animation: fadeIn 0.5s var(--transition-slow) 0.1s both;
}

@media (max-width: 1024px) {
  .bento {
    grid-template-columns: repeat(2, 1fr);
  }

  .bento :deep(.category--lg) {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    order: -1;
  }

  .bento {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .bento :deep(.category--sm),
  .bento :deep(.category--md),
  .bento :deep(.category--lg) {
    grid-column: span 1;
  }
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
  border-radius: 6px;
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

@media (prefers-reduced-motion: reduce) {
  .header,
  .bento,
  .sidebar {
    animation: none;
  }
}
</style>
