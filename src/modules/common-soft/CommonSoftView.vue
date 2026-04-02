<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NEmpty, NInput, NSpin } from 'naive-ui'
import { navConfig } from '../../config/nav.config.js'
import CategorySection from '../nav/components/CategorySection.vue'
import { useFavorites } from '../../composables/useFavorites.js'

const router = useRouter()

const commonSoftCategory = computed(() => navConfig?.categories?.find((c) => c.id === 'common-soft'))

const { toggle: toggleFavorite, has: isFavorited } = useFavorites()

const searchQuery = ref('')
const searchDebounced = ref('')
let debounceTimer = null

function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
}

function compactSearchText(value) {
  return normalizeSearchText(value).replace(/\\s+/g, '')
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

function getItemUrlString(item) {
  const raw = item?.url
  if (Array.isArray(raw)) return raw.filter(Boolean)[0] || ''
  return raw || ''
}

function truncateText(value, max = 100) {
  const text = String(value ?? '').trim()
  if (!text) return ''
  if (text.length <= max) return text
  return `${text.slice(0, max)}...`
}

const allItems = computed(() => {
  const c = commonSoftCategory.value
  const items = c?.items || []
  return items
    .map((item) => ({
      ...item,
      desc: truncateText(item?.desc || item?.description || '', 100),
      description: truncateText(item?.description || item?.desc || '', 100),
      url: getItemUrlString(item),
      urlKey: item?.urlKey || item?.id || String(item?.title || item?.name || item?.url || ''),
      usingFallback: false,
    }))
    .filter((i) => !!i.url)
})

function matchItem(item, q) {
  if (!q) return true
  const fullText = normalizeSearchText([
    item.title,
    item.name,
    item.desc,
    item.description,
    item.extractCode,
    item.extract,
    item.url,
  ].filter(Boolean).join(' '))

  if (fullText.includes(q)) return true
  const compactFullText = compactSearchText(fullText)
  const compactQuery = compactSearchText(q)
  if (compactFullText.includes(compactQuery)) return true
  const allowSubsequence = compactQuery.length >= 3
  return allowSubsequence && isSubsequenceMatch(compactFullText, compactQuery)
}

const filteredItems = computed(() => {
  const q = searchDebounced.value
  return allItems.value.filter((item) => matchItem(item, q))
})

const loading = computed(() => false)

function isItemFavorited(key, currentUrl) {
  return isFavorited(key) || (currentUrl ? isFavorited(currentUrl) : false)
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

const displayName = computed(() => commonSoftCategory.value?.name || '常用软件')
const displayIcon = computed(() => commonSoftCategory.value?.icon || '')
const totalCount = computed(() => allItems.value.length)
const visibleCount = computed(() => filteredItems.value.length)
</script>

<template>
  <div class="common-soft-view">
    <div class="common-soft-view__hero">
      <div class="common-soft-view__hero-top">
        <n-button quaternary class="common-soft-view__back" @click="router.push('/')">← 返回工具导航</n-button>
        <span class="common-soft-view__count">
          {{ searchDebounced ? `显示 ${visibleCount} / ${totalCount}` : `共 ${totalCount} 项` }}
        </span>
      </div>
      <h2 class="common-soft-view__title">
        <span v-if="displayIcon" class="common-soft-view__title-icon" aria-hidden="true">{{ displayIcon }}</span>
        {{ displayName }}
      </h2>
      <p class="common-soft-view__subtitle">
        集中收录常用软件下载入口，支持标题、描述、提取码与链接搜索。超长文本自动缩略，阅读更聚焦。
      </p>

      <div class="common-soft-view__search">
        <n-input
          v-model:value="searchQuery"
          type="search"
          placeholder="搜索常用软件（标题/描述/提取码/链接）…"
          clearable
        >
          <template #prefix>🔎</template>
        </n-input>
      </div>
    </div>

    <div v-if="loading" class="common-soft-view__loading">
      <n-spin size="small" />
    </div>

    <n-empty
      v-else-if="searchDebounced && filteredItems.length === 0"
      description="暂无匹配的常用软件"
    >
      <template #extra>试试其他关键词</template>
    </n-empty>

    <CategorySection
      v-else
      id="common-soft"
      :name="displayName"
      :icon="displayIcon"
      :items="filteredItems"
      :index="0"
      :size="commonSoftCategory?.size || 'md'"
      :is-favorited="isItemFavorited"
      @toggle-favorite="({ key, url }) => toggleItemFavorite(key, url)"
    />
  </div>
</template>

<style scoped>
.common-soft-view {
  animation: fadeIn 0.4s var(--transition-slow) both;
}

.common-soft-view__hero {
  padding: 1rem 1rem 1.15rem;
  margin-bottom: 1rem;
  border: 1px solid var(--border);
  border-radius: 14px;
  background:
    radial-gradient(1200px 260px at 10% -100px, rgba(110, 160, 255, 0.22), transparent 55%),
    radial-gradient(900px 220px at 100% -120px, rgba(76, 220, 190, 0.16), transparent 55%),
    var(--bg-card);
}

.common-soft-view__hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.common-soft-view__back {
  margin: 0;
}

.common-soft-view__count {
  font-size: 0.82rem;
  color: var(--text-muted);
}

.common-soft-view__title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: clamp(1.2rem, 2vw, 1.6rem);
  line-height: 1.2;
}

.common-soft-view__title-icon {
  font-size: 1.1em;
}

.common-soft-view__subtitle {
  margin: 0.55rem 0 0;
  max-width: 72ch;
  color: var(--text-muted);
  line-height: 1.6;
}

.common-soft-view__search {
  max-width: 680px;
  margin-top: 0.9rem;
}

.common-soft-view__loading {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--text-muted);
}

/* 页面内卡片增强阅读性 */
.common-soft-view :deep(.category__grid) {
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 0.9rem;
}

.common-soft-view :deep(.category__title) {
  font-size: 1.02rem;
  margin-bottom: 0.9rem;
}

.common-soft-view :deep(.tool-card__name) {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  font-size: 1rem;
  line-height: 1.4;
}

.common-soft-view :deep(.tool-card__desc) {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  font-size: 0.9rem;
  line-height: 1.6;
}

.common-soft-view :deep(.tool-card__link) {
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 0.85rem;
  padding: 1rem 0.95rem;
  min-height: 150px;
  text-align: left;
}

.common-soft-view :deep(.tool-card__icon) {
  font-size: 1.35rem;
  margin-top: 0.1rem;
}

.common-soft-view :deep(.tool-card__body) {
  align-items: flex-start;
  width: 100%;
}

.common-soft-view :deep(.tool-card__extract-code) {
  max-width: min(280px, 100%);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  .common-soft-view {
    animation: none;
  }
}

@media (max-width: 768px) {
  .common-soft-view__hero {
    padding: 0.85rem 0.75rem 0.95rem;
    border-radius: 12px;
  }

  .common-soft-view__hero-top {
    margin-bottom: 0.65rem;
  }

  .common-soft-view__subtitle {
    font-size: 0.88rem;
    line-height: 1.5;
  }

  .common-soft-view :deep(.category__grid) {
    grid-template-columns: 1fr;
    gap: 0.7rem;
  }

  .common-soft-view :deep(.tool-card__link) {
    flex-direction: row;
    align-items: flex-start;
    justify-content: flex-start;
    min-height: 136px;
    padding: 0.85rem 0.75rem;
    text-align: left;
  }

  .common-soft-view :deep(.tool-card__body) {
    align-items: flex-start;
  }

  .common-soft-view :deep(.tool-card__name) {
    font-size: 0.9rem;
    text-align: left;
  }

  .common-soft-view :deep(.tool-card__desc) {
    display: -webkit-box !important;
    text-align: left;
  }

  .common-soft-view :deep(.tool-card__extract) {
    justify-content: flex-start;
  }
}
</style>

