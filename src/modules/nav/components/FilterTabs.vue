<script setup>
import { computed } from 'vue'

const props = defineProps({
  categories: { type: Array, required: true },
  active: { type: String, default: '' },
})
defineEmits(['update:active'])

const filterOptions = computed(() => [
  { id: '', name: '全部' },
  ...props.categories.map((c) => ({ id: c.id, name: c.name })),
])
</script>

<template>
  <div class="filter-tabs" role="tablist" aria-label="分类筛选">
    <button
      v-for="cat in filterOptions"
      :key="cat.id"
      type="button"
      role="tab"
      :aria-selected="active === cat.id"
      :aria-label="cat.name"
      class="filter-tabs__tab"
      :class="{ 'filter-tabs__tab--active': active === cat.id }"
      @click="$emit('update:active', cat.id)"
    >
      {{ cat.name }}
    </button>
  </div>
</template>

<style scoped>
.filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  -webkit-overflow-scrolling: touch;
}
.filter-tabs::-webkit-scrollbar {
  height: 4px;
}
.filter-tabs::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 2px;
}

.filter-tabs__tab {
  flex-shrink: 0;
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
.filter-tabs__tab:hover {
  color: var(--text);
  border-color: var(--text-muted);
}
.filter-tabs__tab--active {
  color: var(--accent);
  border-color: var(--accent);
}
</style>
