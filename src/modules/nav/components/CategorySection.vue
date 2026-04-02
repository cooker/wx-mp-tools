<script setup>
import { computed } from 'vue'
import { NCard } from 'naive-ui'
import ToolCard from './ToolCard.vue'

const props = defineProps({
  id: { type: String, default: '' },
  name: { type: String, required: true },
  icon: { type: String, default: '' },
  items: { type: Array, required: true },
  index: { type: Number, default: 0 },
  size: { type: String, default: 'md' },
  isFavorited: { type: Function, default: () => false },
})
const emit = defineEmits(['toggle-favorite'])

const sectionId = props.id || `cat-${props.index}`

const gridClass = computed(() => {
  const map = { sm: 'category--sm', md: 'category--md', lg: 'category--lg' }
  return map[props.size] || 'category--md'
})
</script>

<template>
  <section
    class="category"
    :class="gridClass"
    :aria-labelledby="sectionId"
    :style="{ animationDelay: `${0.1 + index * 0.06}s` }"
  >
    <n-card embedded size="small">
      <h2 :id="sectionId" class="category__title">
        <span v-if="icon" class="category__icon" aria-hidden="true">{{ icon }}</span>
        {{ name }}
      </h2>
      <div v-if="items.length > 0" class="category__grid">
        <ToolCard
          v-for="(item, i) in items"
          :key="item.urlKey || item.url || item.title || item.name || i"
          :name="item.title || item.name"
          :title="item.title"
          :url="item.url"
          :desc="item.desc || item.description"
          :extract-code="item.extractCode || item.extract || ''"
          :icon="item.icon"
          :using-fallback="!!item.usingFallback"
          :favorited="!item.internal && isFavorited(item.urlKey || item.url, item.url)"
          :internal="!!item.internal"
          @toggle-favorite="emit('toggle-favorite', { key: item.urlKey || item.url, url: item.url })"
        />
      </div>
      <div v-else class="category__empty">
        暂无配置：在 `src/config/nav.config.js` 的该分类下补充 `items`
      </div>
    </n-card>
  </section>
</template>

<style scoped>
.category {
  animation: categoryFadeIn 0.4s var(--transition-slow) both;
}

.category__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 1rem;
}

.category__icon {
  font-size: 1.1rem;
}

.category__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.category__empty {
  padding: 1.25rem 0.75rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.5;
}

@keyframes categoryFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 移动端：一行三列，列宽均分 */
@media (max-width: 768px) {
  .category__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.45rem;
  }

  .category__title {
    font-size: 0.8rem;
    margin-bottom: 0.65rem;
    letter-spacing: 0.05em;
  }

  .category__icon {
    font-size: 1rem;
  }

  .category :deep(.n-card-content) {
    padding: 0.65rem 0.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .category {
    animation: none;
  }
}
</style>
