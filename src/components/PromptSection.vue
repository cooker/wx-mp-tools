<script setup>
import { computed } from 'vue'
import { usePrompts } from '../composables/usePrompts.js'
import PromptCard from './PromptCard.vue'

const props = defineProps({
  /** 独立页面模式：无上边距与分隔线 */
  standalone: { type: Boolean, default: false },
})

const { config, loading, searchQuery, activeTag, setActiveTag, allTags, filteredPrompts } = usePrompts()

const show = computed(() => Boolean(config?.enabled))
</script>

<template>
  <section v-if="show" id="prompts" class="prompt-section" :class="{ 'prompt-section--standalone': standalone }" aria-label="开发提示词">
    <h2 class="prompt-section__title">{{ config.title || '开发提示词' }}</h2>

    <div class="prompt-section__toolbar">
      <div class="prompt-section__search">
        <input
          v-model="searchQuery"
          type="search"
          class="prompt-section__input"
          placeholder="搜索提示词…"
          inputmode="search"
          autocomplete="off"
          aria-label="搜索提示词"
        />
        <svg class="prompt-section__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>
      <div class="prompt-section__filters" role="tablist" aria-label="标签筛选">
        <button
          type="button"
          role="tab"
          class="prompt-section__tab"
          :class="{ 'prompt-section__tab--active': !activeTag }"
          :aria-selected="!activeTag"
          aria-label="全部"
          @click="setActiveTag('')"
        >
          全部
        </button>
        <button
          v-for="tag in allTags"
          :key="tag"
          type="button"
          role="tab"
          class="prompt-section__tab"
          :class="{ 'prompt-section__tab--active': activeTag === tag }"
          :aria-selected="activeTag === tag"
          :aria-label="tag"
          @click="setActiveTag(tag)"
        >
          {{ tag }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="prompt-section__loading">加载中…</div>

    <div v-else-if="filteredPrompts.length === 0" class="prompt-section__empty">
      <p class="prompt-section__empty-text">暂无匹配的提示词</p>
      <p class="prompt-section__empty-hint">试试其他关键词或切换分类</p>
    </div>

    <div v-else class="prompt-section__grid">
      <PromptCard
        v-for="p in filteredPrompts"
        :key="p.id"
        :title="p.title"
        :content="p.content"
        :tags="p.tags"
      />
    </div>
  </section>
</template>

<style scoped>
.prompt-section {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-subtle);
  animation: fadeIn 0.4s var(--transition-slow) both;
}
.prompt-section--standalone {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.prompt-section__title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.prompt-section__toolbar {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.prompt-section__search {
  position: relative;
  max-width: 320px;
}

.prompt-section__input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  font-size: 0.95rem;
  color: var(--text);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: border-color var(--transition);
}
.prompt-section__input::placeholder {
  color: var(--text-muted);
}
.prompt-section__input:focus {
  border-color: var(--accent);
  outline: none;
  box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.2);
}

.prompt-section__search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.1rem;
  height: 1.1rem;
  color: var(--text-muted);
  pointer-events: none;
}

.prompt-section__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  -webkit-overflow-scrolling: touch;
}

.prompt-section__tab {
  flex-shrink: 0;
  padding: 0.5rem 1rem;
  min-height: 44px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 9999px;
  transition: border-color var(--transition), color var(--transition);
}
.prompt-section__tab:hover {
  color: var(--text);
  border-color: var(--text-muted);
}
.prompt-section__tab--active {
  color: var(--accent);
  border-color: var(--accent);
}

.prompt-section__loading,
.prompt-section__empty {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--text-muted);
}
.prompt-section__empty-text {
  font-size: 1rem;
  margin-bottom: 0.25rem;
}
.prompt-section__empty-hint {
  font-size: 0.9rem;
  opacity: 0.8;
}

.prompt-section__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
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
  .prompt-section {
    animation: none;
  }
}
</style>
