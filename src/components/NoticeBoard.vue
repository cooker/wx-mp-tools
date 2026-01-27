<script setup>
import { computed } from 'vue'

const props = defineProps({
  config: { type: Object, default: () => ({}) },
})

const show = computed(() => Boolean(props.config?.enabled && props.config?.items?.length))

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <aside v-if="show" class="notice-board" aria-label="公告">
    <h2 class="notice-board__title">
      <span class="notice-board__icon" aria-hidden="true">📢</span>
      {{ config.title || '公告' }}
    </h2>
    <ul class="notice-board__list">
      <li
        v-for="(notice, index) in config.items"
        :key="index"
        class="notice-board__item"
      >
        <component
          :is="notice.url ? 'a' : 'div'"
          :href="notice.url || undefined"
          :target="notice.url ? '_blank' : undefined"
          :rel="notice.url ? 'noopener noreferrer' : undefined"
          class="notice-board__link"
          :class="{ 'notice-board__link--no-link': !notice.url }"
        >
          <div class="notice-board__header">
            <h3 class="notice-board__notice-title">{{ notice.title }}</h3>
            <time v-if="notice.date" class="notice-board__date" :datetime="notice.date">
              {{ formatDate(notice.date) }}
            </time>
          </div>
          <p v-if="notice.content" class="notice-board__content">
            {{ notice.content }}
          </p>
        </component>
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.notice-board {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.25rem;
  position: sticky;
  top: 2rem;
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
}

.notice-board__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 1rem;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.notice-board__icon {
  font-size: 1.1rem;
}

.notice-board__list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.notice-board__item {
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.75rem;
}

.notice-board__item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.notice-board__link {
  display: block;
  transition: var(--transition);
  border-radius: 6px;
  padding: 0.5rem;
  margin: -0.5rem;
}

.notice-board__link:hover {
  background: var(--bg-elevated);
}

.notice-board__link--no-link {
  cursor: default;
}

.notice-board__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.375rem;
}

.notice-board__notice-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text);
  line-height: 1.4;
  flex: 1;
}

.notice-board__date {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
  white-space: nowrap;
  flex-shrink: 0;
}

.notice-board__content {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0;
}

/* 滚动条样式 */
.notice-board::-webkit-scrollbar {
  width: 6px;
}

.notice-board::-webkit-scrollbar-track {
  background: transparent;
}

.notice-board::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}

.notice-board::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}
</style>
