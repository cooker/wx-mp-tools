<script setup>
import { computed } from 'vue'
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
    <h2 :id="sectionId" class="category__title">
      <span v-if="icon" class="category__icon" aria-hidden="true">{{ icon }}</span>
      {{ name }}
    </h2>
    <div class="category__grid">
      <ToolCard
        v-for="(item, i) in items"
        :key="item.url || item.name || i"
        :name="item.name"
        :url="item.url"
        :desc="item.desc"
        :icon="item.icon"
        :favorited="!item.internal && isFavorited(item.url)"
        :internal="!!item.internal"
        @toggle-favorite="emit('toggle-favorite', item.url)"
      />
    </div>
  </section>
</template>

<style scoped>
.category {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
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

@media (prefers-reduced-motion: reduce) {
  .category {
    animation: none;
  }
}
</style>
