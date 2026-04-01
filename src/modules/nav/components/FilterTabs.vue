<script setup>
import { computed } from 'vue'
import { NButton, NSpace } from 'naive-ui'

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
  <n-space class="filter-tabs" role="tablist" aria-label="分类筛选" :wrap="false">
    <n-button
      v-for="cat in filterOptions"
      :key="cat.id"
      role="tab"
      :aria-selected="active === cat.id"
      :aria-label="cat.name"
      class="filter-tabs__tab"
      size="small"
      :type="active === cat.id ? 'primary' : 'default'"
      quaternary
      @click="$emit('update:active', cat.id)"
    >
      {{ cat.name }}
    </n-button>
  </n-space>
</template>

<style scoped>
.filter-tabs {
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
}
</style>
