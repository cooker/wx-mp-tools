<script setup>
import { ref, computed, watch } from 'vue'
import { navConfig } from './config/nav.config.js'
import CategorySection from './components/CategorySection.vue'
import AdSlot from './components/AdSlot.vue'
import NoticeBoard from './components/NoticeBoard.vue'
import SidebarQrCodes from './components/SidebarQrCodes.vue'
import SearchBar from './components/SearchBar.vue'
import FilterTabs from './components/FilterTabs.vue'
import { useFavorites } from './composables/useFavorites.js'

const { has: isFavorited, toggle: toggleFavorite } = useFavorites()

const { site, categories, ad = {}, notices = {}, rewardCode = {}, groupCode = {} } = navConfig

const searchQuery = ref('')
const activeCategory = ref('')
const showFavoritesOnly = ref(false)
const searchExpanded = ref(true)

// Debounce search input for filtering
const searchDebounced = ref('')
let debounceTimer = null
watch(searchQuery, (v) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    searchDebounced.value = v.trim().toLowerCase()
  }, 300)
}, { immediate: true })

function matchItem(item, q) {
  if (!q) return true
  const name = (item.name || '').toLowerCase()
  const desc = (item.desc || '').toLowerCase()
  return name.includes(q) || desc.includes(q)
}

const filteredCategories = computed(() => {
  const q = searchDebounced.value
  const cat = activeCategory.value
  const favOnly = showFavoritesOnly.value

  return categories
    .filter((c) => !cat || c.id === cat)
    .map((c) => ({
      ...c,
      items: c.items.filter((item) => {
        if (!matchItem(item, q)) return false
        if (favOnly && !isFavorited(item.url)) return false
        return true
      }),
    }))
    .filter((c) => c.items.length > 0)
})

const hasNoResults = computed(() =>
  showFavoritesOnly.value
    ? favoriteItems.value.length === 0
    : filteredCategories.value.length === 0
)

const allItemsFlat = computed(() => {
  const items = []
  categories.forEach((c) => {
    c.items.forEach((item) => items.push({ ...item, categoryId: c.id }))
  })
  return items
})

const favoriteItems = computed(() => {
  const q = searchDebounced.value
  return allItemsFlat.value.filter((item) => {
    if (!isFavorited(item.url)) return false
    return matchItem(item, q)
  })
})
</script>

<template>
  <header class="header">
    <h1 class="header__title">{{ site.title }}</h1>
    <p v-if="site.description" class="header__desc">{{ site.description }}</p>
  </header>

  <div class="toolbar">
    <div class="toolbar__row">
      <SearchBar v-model="searchQuery" v-model:expanded="searchExpanded" />
      <button
        type="button"
        class="btn-favorites"
        :class="{ 'btn-favorites--active': showFavoritesOnly }"
        :aria-pressed="showFavoritesOnly"
        @click="showFavoritesOnly = !showFavoritesOnly"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        <span>我的收藏</span>
      </button>
    </div>
    <FilterTabs
      v-if="!showFavoritesOnly"
      :categories="categories"
      :active="activeCategory"
      @update:active="activeCategory = $event"
    />
  </div>

  <div v-if="hasNoResults" class="empty-state">
    <p class="empty-state__text">暂无结果</p>
    <p class="empty-state__hint">试试其他关键词或切换分类</p>
  </div>

  <template v-else>
    <!-- 收藏模式：扁平列表 -->
    <div v-if="showFavoritesOnly" class="content content--flat">
      <div class="card-grid">
        <CategorySection
          v-if="favoriteItems.length > 0"
          id="favorites"
          name="收藏的工具"
          :items="favoriteItems"
          :is-favorited="isFavorited"
          @toggle-favorite="toggleFavorite"
        />
      </div>
    </div>

    <!-- 正常模式：按分类 -->
    <div v-else class="layout">
      <main class="content">
        <CategorySection
          v-for="(cat, index) in filteredCategories"
          :key="cat.id"
          :id="cat.id"
          :name="cat.name"
          :icon="cat.icon"
          :items="cat.items"
          :index="index"
          :is-favorited="isFavorited"
          @toggle-favorite="toggleFavorite"
        />
      </main>

      <aside class="sidebar">
        <NoticeBoard :config="notices" />
        <SidebarQrCodes :reward-code="rewardCode" :group-code="groupCode" />
      </aside>
    </div>
  </template>

  <AdSlot :config="ad" />

  <footer class="footer">
    <p>编辑 <code>src/config/nav.config.js</code> 快速配置导航</p>
  </footer>
</template>

<style scoped>
.header {
  margin-bottom: 1.5rem;
  animation: fadeIn 0.4s var(--transition-slow) both;
}

.header__title {
  font-size: clamp(1.5rem, 4vw, 2rem);
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

.toolbar {
  margin-bottom: 1.5rem;
  animation: fadeIn 0.4s var(--transition-slow) 0.05s both;
}

.toolbar__row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 0.75rem;
}

.btn-favorites {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  min-height: 44px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: border-color var(--transition), color var(--transition);
}
.btn-favorites:hover {
  color: var(--text);
  border-color: var(--text-muted);
}
.btn-favorites--active {
  color: var(--accent);
  border-color: var(--accent);
}
.btn-favorites svg {
  width: 18px;
  height: 18px;
}

.empty-state {
  padding: 3rem 1rem;
  text-align: center;
  animation: fadeIn 0.4s var(--transition-slow) both;
}
.empty-state__text {
  font-size: 1rem;
  color: var(--text-muted);
  margin-bottom: 0.25rem;
}
.empty-state__hint {
  font-size: 0.9rem;
  color: var(--text-muted);
  opacity: 0.8;
}

.layout {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 1.5rem;
  align-items: start;
}

.content {
  min-width: 0;
  animation: fadeIn 0.4s var(--transition-slow) 0.1s both;
}

.content--flat .card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.sidebar {
  animation: fadeIn 0.4s var(--transition-slow) 0.12s both;
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

@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    order: -1;
  }

  .toolbar__row {
    flex-wrap: wrap;
  }
}

@media (prefers-reduced-motion: reduce) {
  .header,
  .toolbar,
  .content,
  .sidebar,
  .empty-state {
    animation: none;
  }
}
</style>
