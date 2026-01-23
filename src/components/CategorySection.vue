<script setup>
import ToolCard from './ToolCard.vue'

const props = defineProps({
  id: { type: String, default: '' },
  name: { type: String, required: true },
  icon: { type: String, default: '' },
  items: { type: Array, required: true },
  index: { type: Number, default: 0 },
})

const sectionId = props.id || `cat-${props.index}`
</script>

<template>
  <section class="category" :aria-labelledby="sectionId" :style="{ animationDelay: `${0.15 + index * 0.08 }s` }">
    <h2 :id="sectionId" class="category__title">
      <span v-if="icon" class="category__icon" aria-hidden="true">{{ icon }}</span>
      {{ name }}
    </h2>
    <div class="category__grid">
      <ToolCard
        v-for="(item, i) in items"
        :key="i"
        :name="item.name"
        :url="item.url"
        :desc="item.desc"
        :icon="item.icon"
      />
    </div>
  </section>
</template>

<style scoped>
.category {
  margin-bottom: 2.5rem;
  animation: categoryFadeIn 0.4s ease both;
}

.category:last-child {
  margin-bottom: 0;
}

.category__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 1rem;
  font-family: var(--font-mono);
}

.category__icon {
  font-size: 1.1rem;
}

.category__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
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
</style>
