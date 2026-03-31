<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { navConfig } from '../../config/nav.config.js'
import { sqlConfig } from '../../config/sql.config.js'
import CategorySection from './components/CategorySection.vue'
import SearchBar from './components/SearchBar.vue'
import FilterTabs from './components/FilterTabs.vue'
import AdSlot from '../shared/AdSlot.vue'
import NoticeBoard from '../shared/NoticeBoard.vue'
import SidebarQrCodes from '../shared/SidebarQrCodes.vue'
import { useFavorites } from '../../composables/useFavorites.js'

const { has: isFavorited, toggle: toggleFavorite } = useFavorites()

const { site, categories, ad = {}, notices = {}, rewardCode = {}, groupCode = {} } = navConfig
const URL_RESOLVE_CACHE_KEY = 'tool-nav-url-resolve-cache-v1'
const URL_RESOLVE_TTL_MS = Number(navConfig?.urlResolver?.cacheTtlMs) || 6 * 60 * 60 * 1000
const URL_CHECK_TIMEOUT_MS = Number(navConfig?.urlResolver?.timeoutMs) || 2500
const resolvedUrlMap = ref({})

const searchQuery = ref('')
const activeCategory = ref('')
const showFavoritesOnly = ref(false)
const searchExpanded = ref(true)

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

function getItemUrlCandidates(item) {
  if (Array.isArray(item.url)) return item.url.filter(Boolean)
  return item.url ? [item.url] : []
}

function getItemResolvedUrl(item) {
  const candidates = getItemUrlCandidates(item)
  const key = getItemUrlKey(item)
  return resolvedUrlMap.value[key] || candidates[0] || ''
}

function getItemUrlKey(item) {
  if (item.internal) return String(item.url || item.name || '')
  if (item.id) return String(item.id)
  const candidates = getItemUrlCandidates(item)
  return `${item.name || 'item'}::${candidates[0] || ''}`
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

async function isReachable(url) {
  try {
    await withTimeout(
      fetch(url, { method: 'GET', mode: 'no-cors', cache: 'no-store' }),
      URL_CHECK_TIMEOUT_MS
    )
    return true
  } catch {
    return false
  }
}

function loadResolveCache() {
  try {
    const raw = localStorage.getItem(URL_RESOLVE_CACHE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed
  } catch {
    return {}
  }
}

function saveResolveCache(map) {
  try {
    localStorage.setItem(URL_RESOLVE_CACHE_KEY, JSON.stringify(map))
  } catch {}
}

function isItemFavorited(item) {
  const key = getItemUrlKey(item)
  // 兼容历史收藏：旧版本按 url 存储
  return isFavorited(key) || isFavorited(getItemResolvedUrl(item))
}

function toggleItemFavorite(key, currentUrl) {
  const hasKey = isFavorited(key)
  const hasLegacy = currentUrl ? isFavorited(currentUrl) : false
  if (hasLegacy && !hasKey) {
    toggleFavorite(currentUrl)
    toggleFavorite(key)
    return
  }
  toggleFavorite(key)
}

async function resolveUrls() {
  const cache = loadResolveCache()
  const nextResolved = { ...resolvedUrlMap.value }
  const nextCache = { ...cache }
  const now = Date.now()

  const tasks = []
  categories.forEach((cat) => {
    cat.items.forEach((item) => {
      if (item.internal) return
      const candidates = getItemUrlCandidates(item)
      if (candidates.length <= 1) return
      tasks.push({ item, candidates, key: getItemUrlKey(item) })
    })
  })

  for (const task of tasks) {
    const cacheEntry = nextCache[task.key]
    if (cacheEntry?.url && now - Number(cacheEntry.ts || 0) < URL_RESOLVE_TTL_MS) {
      nextResolved[task.key] = cacheEntry.url
      continue
    }
    let picked = task.candidates[0]
    for (const candidate of task.candidates) {
      // 弱连通探测：能完成请求即认为可用优先
      if (await isReachable(candidate)) {
        picked = candidate
        break
      }
    }
    nextResolved[task.key] = picked
    nextCache[task.key] = { url: picked, ts: now }
  }
  // 清理无效 key，避免缓存无限增长
  const activeKeys = new Set(tasks.map((t) => t.key))
  Object.keys(nextCache).forEach((k) => {
    if (!activeKeys.has(k)) delete nextCache[k]
  })

  resolvedUrlMap.value = nextResolved
  saveResolveCache(nextCache)
}

onMounted(() => {
  const cache = loadResolveCache()
  const now = Date.now()
  const warmup = {}
  Object.keys(cache).forEach((k) => {
    const entry = cache[k]
    if (entry?.url && now - Number(entry.ts || 0) < URL_RESOLVE_TTL_MS) {
      warmup[k] = entry.url
    }
  })
  resolvedUrlMap.value = warmup
  resolveUrls()
})

function decorateItem(item, categoryId) {
  const candidates = getItemUrlCandidates(item)
  const resolvedUrl = getItemResolvedUrl(item)
  const primaryUrl = candidates[0] || resolvedUrl
  const hasFallbacks = candidates.length > 1
  const usingFallback = hasFallbacks && resolvedUrl && resolvedUrl !== primaryUrl
  return {
    ...item,
    categoryId,
    url: resolvedUrl,
    urlKey: getItemUrlKey(item),
    usingFallback,
  }
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
        const currentUrl = getItemResolvedUrl(item)
        if (currentUrl === '/sql' && !sqlConfig?.enabled) return false
        if (!matchItem(item, q)) return false
        if (favOnly && !isItemFavorited(item)) return false
        return true
      }).map((item) => decorateItem(item, c.id)),
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
    c.items.forEach((item) => items.push(decorateItem(item, c.id)))
  })
  return items
})

const favoriteItems = computed(() => {
  const q = searchDebounced.value
  return allItemsFlat.value.filter((item) => {
    if (!isItemFavorited(item)) return false
    return matchItem(item, q)
  })
})
</script>

<template>
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
    <div v-if="showFavoritesOnly" class="content content--flat">
      <div class="card-grid">
        <CategorySection
          v-if="favoriteItems.length > 0"
          id="favorites"
          name="收藏的工具"
          :items="favoriteItems"
          :is-favorited="(key, url) => isFavorited(key) || (!!url && isFavorited(url))"
          @toggle-favorite="({ key, url }) => toggleItemFavorite(key, url)"
        />
      </div>
    </div>

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
          :is-favorited="(key, url) => isFavorited(key) || (!!url && isFavorited(url))"
          @toggle-favorite="({ key, url }) => toggleItemFavorite(key, url)"
        />
      </main>

      <aside class="sidebar">
        <NoticeBoard :config="notices" />
        <SidebarQrCodes :reward-code="rewardCode" :group-code="groupCode" />
      </aside>
    </div>
  </template>

  <AdSlot :config="ad" />
</template>

<style scoped>
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
  .toolbar,
  .content,
  .sidebar,
  .empty-state {
    animation: none;
  }
}
</style>
