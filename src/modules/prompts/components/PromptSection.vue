<script setup>
import { computed } from 'vue'
import { NButton, NEmpty, NInput, NSpin, NSpace } from 'naive-ui'
import { usePrompts } from '../../../composables/usePrompts.js'
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
      <n-space class="prompt-section__filters" role="tablist" aria-label="标签筛选" :wrap="true" :size="[8, 8]">
        <n-button
          role="tab"
          class="prompt-section__tab"
          size="small"
          quaternary
          :type="!activeTag ? 'primary' : 'default'"
          :aria-selected="!activeTag"
          aria-label="全部"
          @click="setActiveTag('')"
        >
          全部
        </n-button>
        <n-button
          v-for="tag in allTags"
          :key="tag"
          role="tab"
          class="prompt-section__tab"
          size="small"
          quaternary
          :type="activeTag === tag ? 'primary' : 'default'"
          :aria-selected="activeTag === tag"
          :aria-label="tag"
          @click="setActiveTag(tag)"
        >
          {{ tag }}
        </n-button>
      </n-space>
    </div>

    <div v-if="loading" class="prompt-section__loading">
      <n-spin size="small" />
    </div>

    <div v-else-if="filteredPrompts.length === 0" class="prompt-section__empty">
      <n-empty description="暂无匹配的提示词">
        <template #extra>试试其他关键词或切换分类</template>
      </n-empty>
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
  max-width: 360px;
}

.prompt-section__filters {
  align-items: center;
}

.prompt-section__tab {
  flex-shrink: 0;
  border-radius: 999px;
}

.prompt-section__loading,
.prompt-section__empty {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--text-muted);
}

.prompt-section__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

@media (max-width: 768px) {
  .prompt-section__toolbar {
    gap: 0.6rem;
  }

  .prompt-section__search {
    max-width: 100%;
  }

  .prompt-section__grid {
    grid-template-columns: 1fr;
  }
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
