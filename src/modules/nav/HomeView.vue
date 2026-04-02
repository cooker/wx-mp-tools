<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { NButton, NEmpty, NInput, NSpace } from 'naive-ui'
import { navConfig } from '../../config/nav.config.js'
import { sqlConfig } from '../../config/sql.config.js'
import { preloadRouteComponents } from '../../router/index.js'
import CategorySection from './components/CategorySection.vue'
import FilterTabs from './components/FilterTabs.vue'
import AdSlot from '../shared/AdSlot.vue'
import NoticeBoard from '../shared/NoticeBoard.vue'
import SidebarQrCodes from '../shared/SidebarQrCodes.vue'
import { useFavorites } from '../../composables/useFavorites.js'

const { has: isFavorited, toggle: toggleFavorite } = useFavorites()

const { site, categories, ad = {}, notices = {}, rewardCode = {}, groupCode = {} } = navConfig
const perfConfig = navConfig?.performance || {}
const legacyUrlResolver = navConfig?.urlResolver || {}
const legacyRouteWarmup = navConfig?.routeWarmup || {}
const urlResolverConfig = perfConfig.urlResolver || legacyUrlResolver
const routeWarmupConfig = perfConfig.routeWarmup || legacyRouteWarmup
const URL_RESOLVE_CACHE_KEY = 'tool-nav-url-resolve-cache-v1'
const URL_RESOLVE_TTL_MS = Number(urlResolverConfig?.cacheTtlMs) || 6 * 60 * 60 * 1000
const URL_CHECK_TIMEOUT_MS = Number(urlResolverConfig?.timeoutMs) || 2500
const resolvedUrlMap = ref({})

const searchQuery = ref('')
const activeCategory = ref('')
const showFavoritesOnly = ref(false)
const searchExpanded = ref(true)
const showMobileQr = ref(false)
const isSearchMobile = ref(false)

function checkSearchMobile() {
  isSearchMobile.value = typeof window !== 'undefined' && window.innerWidth < 768
}

const showHomeSearchInput = computed(
  () => searchExpanded.value || !isSearchMobile.value
)

const searchDebounced = ref('')
let debounceTimer = null
function normalizeSearchText(value) {
  return String(value ?? '').trim().toLowerCase()
}

function compactSearchText(value) {
  return normalizeSearchText(value).replace(/\s+/g, '')
}

function collectSearchableTexts(value, bucket) {
  if (value == null) return
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    bucket.push(String(value))
    return
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectSearchableTexts(item, bucket))
    return
  }
  if (typeof value === 'object') {
    Object.values(value).forEach((item) => collectSearchableTexts(item, bucket))
  }
}

function getItemSearchText(item, category) {
  const parts = []
  // 仅索引业务可读字段，避免 url/http 等噪音导致误命中
  collectSearchableTexts(
    {
      name: item?.name,
      description: item?.description,
      desc: item?.desc,
      summary: item?.summary,
      tags: item?.tags,
      keywords: item?.keywords,
      keyword: item?.keyword,
      aliases: item?.aliases,
      alias: item?.alias,
    },
    parts
  )
  collectSearchableTexts(
    {
      categoryId: category?.id,
      categoryName: category?.name,
      categoryIcon: category?.icon,
    },
    parts
  )
  return normalizeSearchText(parts.join(' '))
}

function isSubsequenceMatch(text, query) {
  if (!query) return true
  let qi = 0
  for (let ti = 0; ti < text.length && qi < query.length; ti += 1) {
    if (text[ti] === query[qi]) qi += 1
  }
  return qi === query.length
}

watch(searchQuery, (v) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    searchDebounced.value = normalizeSearchText(v)
  }, 300)
}, { immediate: true })

function matchItem(item, q, category) {
  if (!q) return true
  const fullText = getItemSearchText(item, category)
  const compactFullText = compactSearchText(fullText)
  const compactQuery = compactSearchText(q)
  const allowSubsequence = compactQuery.length >= 3

  // 全文检索 + 模糊匹配（连续子串 + 非连续顺序字符）
  return (
    fullText.includes(q) ||
    compactFullText.includes(compactQuery) ||
    (allowSubsequence && isSubsequenceMatch(compactFullText, compactQuery))
  )
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
  checkSearchMobile()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', checkSearchMobile)
  }

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

  // 空闲时预热次级路由，减少首次打开延迟（可配置关闭）
  if (!routeWarmupConfig.enabled) return
  const warmupRoutesList = Array.isArray(routeWarmupConfig.routes) && routeWarmupConfig.routes.length
    ? routeWarmupConfig.routes
    : ['prompts', 'sql']
  const warmupTimeoutMs = Number(routeWarmupConfig.timeoutMs) || 2000
  const warmupDelayMs = Number(routeWarmupConfig.delayMs) || 600
  const warmupRoutes = () => {
    preloadRouteComponents(warmupRoutesList)
  }
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(warmupRoutes, { timeout: warmupTimeoutMs })
  } else {
    setTimeout(warmupRoutes, warmupDelayMs)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkSearchMobile)
  }
})

watch(showMobileQr, (open) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = open ? 'hidden' : ''
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
        if (!matchItem(item, q, c)) return false
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
    return matchItem(item, q, categories.find((c) => c.id === item.categoryId))
  })
})

const visibleCategoriesForTabs = computed(() => {
  const base = searchDebounced.value ? filteredCategories.value : categories
  return base.map((c) => ({ id: c.id, name: c.name, icon: c.icon }))
})
</script>

<template>
  <div class="toolbar">
    <div class="toolbar__row">
      <div class="home-search">
        <n-button
          v-if="isSearchMobile && !searchExpanded"
          class="home-search__toggle"
          aria-label="展开搜索"
          @click="searchExpanded = true"
        >
          🔍
        </n-button>
        <div v-show="showHomeSearchInput" class="home-search__wrap">
          <n-input
            v-model:value="searchQuery"
            type="search"
            class="home-search__input"
            placeholder="搜索工具名称或描述…"
            aria-label="搜索工具"
            clearable
          >
            <template #prefix>🔎</template>
          </n-input>
          <n-button
            v-if="isSearchMobile && searchExpanded"
            class="home-search__close"
            text
            aria-label="收起搜索"
            @click="searchExpanded = false"
          >
            ✕
          </n-button>
        </div>
      </div>
      <n-button
        class="btn-favorites"
        :type="showFavoritesOnly ? 'primary' : 'default'"
        quaternary
        :aria-pressed="showFavoritesOnly"
        @click="showFavoritesOnly = !showFavoritesOnly"
      >
        <span>⭐ 我的收藏</span>
      </n-button>
    </div>
    <FilterTabs
      v-if="!showFavoritesOnly"
      :categories="visibleCategoriesForTabs"
      :active="activeCategory"
      @update:active="activeCategory = $event"
    />
  </div>

  <div v-if="hasNoResults" class="empty-state">
    <n-empty description="暂无结果">
      <template #extra>试试其他关键词或切换分类</template>
    </n-empty>
  </div>

  <template v-else>
    <div v-if="showFavoritesOnly" class="content content--flat">
      <n-space vertical :size="16">
        <CategorySection
          v-if="favoriteItems.length > 0"
          id="favorites"
          name="收藏的工具"
          :items="favoriteItems"
          :is-favorited="(key, url) => isFavorited(key) || (!!url && isFavorited(url))"
          @toggle-favorite="({ key, url }) => toggleItemFavorite(key, url)"
        />
      </n-space>
    </div>

    <div v-else class="layout">
      <main class="content">
        <n-space vertical :size="16">
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
        </n-space>
      </main>

      <aside class="sidebar">
        <NoticeBoard :config="notices" />
        <div class="sidebar__qrcodes-desktop">
          <SidebarQrCodes :reward-code="rewardCode" :group-code="groupCode" />
        </div>
      </aside>
    </div>
  </template>

  <div class="mobile-qr">
    <n-button
      class="mobile-qr__fab"
      type="primary"
      circle
      aria-label="打开二维码面板"
      title="打开二维码面板"
      @click="showMobileQr = true"
    >
      ☕
    </n-button>
    <div v-if="showMobileQr" class="mobile-qr__mask" @click="showMobileQr = false" />
    <div v-if="showMobileQr" class="mobile-qr__panel">
      <div class="mobile-qr__panel-head">
        <span>扫码入口</span>
        <n-button text @click="showMobileQr = false">关闭</n-button>
      </div>
      <SidebarQrCodes :reward-code="rewardCode" :group-code="groupCode" />
    </div>
  </div>

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

.home-search {
  position: relative;
  flex: 1;
  min-width: 0;
}

.home-search__toggle {
  width: 48px;
  height: 48px;
}

.home-search__wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.home-search__input {
  width: 100%;
}

.home-search__close {
  position: absolute;
  right: 0.5rem;
  width: 32px;
  height: 32px;
  min-width: 32px;
  padding: 0;
  z-index: 1;
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
  grid-template-columns: minmax(0, 1fr) minmax(408px, 440px);
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

.mobile-qr {
  display: none;
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

  .sidebar__qrcodes-desktop {
    display: none;
  }

  .mobile-qr {
    display: block;
  }

  .mobile-qr__fab {
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 90;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }

  .mobile-qr__mask {
    position: fixed;
    inset: 0;
    z-index: 91;
    background: rgba(15, 23, 42, 0.35);
  }

  .mobile-qr__panel {
    position: fixed;
    right: 12px;
    bottom: 72px;
    z-index: 92;
    /* 容纳左右两枚二维码（缩略尺寸） */
    width: min(400px, calc(100vw - 16px));
    max-height: min(70vh, 520px);
    overflow: auto;
    border-radius: 14px;
    padding: 0.65rem 0.55rem;
    background: var(--bg-card);
    border: 1px solid var(--border);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22);
  }

  /* 扫码面板内：固定两列左右排布，略缩小卡片与图，避免挤爆窄屏 */
  .mobile-qr__panel :deep(.qr-codes) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.45rem;
    margin-top: 0.45rem;
  }

  .mobile-qr__panel :deep(.qr-card) {
    padding: 0.45rem 0.3rem;
  }

  .mobile-qr__panel :deep(.qr-card__title) {
    font-size: 0.72rem;
    margin-bottom: 0.35rem;
  }

  .mobile-qr__panel :deep(.qr-card__img) {
    width: 128px;
    height: 128px;
    max-width: 100%;
  }

  .mobile-qr__panel :deep(.qr-card__img img),
  .mobile-qr__panel :deep(.n-image img) {
    width: 128px !important;
    height: 128px !important;
    max-width: 100% !important;
    object-fit: cover;
  }

  .mobile-qr__panel :deep(.qr-card__desc) {
    font-size: 0.68rem;
    margin-top: 0.3rem;
    line-height: 1.35;
  }

  @media (max-width: 359px) {
    .mobile-qr__panel :deep(.qr-card__img) {
      width: 108px;
      height: 108px;
    }

    .mobile-qr__panel :deep(.qr-card__img img),
    .mobile-qr__panel :deep(.n-image img) {
      width: 108px !important;
      height: 108px !important;
    }

    .mobile-qr__panel :deep(.qr-codes) {
      gap: 0.35rem;
    }
  }

  .mobile-qr__panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.25rem;
    color: var(--text);
    font-size: 0.92rem;
    font-weight: 600;
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
