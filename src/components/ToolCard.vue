<script setup>
defineProps({
  name: { type: String, required: true },
  url: { type: String, required: true },
  desc: { type: String, default: '' },
  icon: { type: String, default: '' },
})
</script>

<template>
  <a
    :href="url"
    target="_blank"
    rel="noopener noreferrer"
    class="tool-card"
  >
    <span v-if="icon" class="tool-card__icon" aria-hidden="true">{{ icon }}</span>
    <div class="tool-card__body">
      <span class="tool-card__name">{{ name }}</span>
      <span v-if="desc" class="tool-card__desc">{{ desc }}</span>
    </div>
    <span class="tool-card__arrow" aria-hidden="true">→</span>
  </a>
</template>

<style scoped>
.tool-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: var(--transition);
  text-align: left;
}

.tool-card:hover {
  border-color: var(--accent);
  background: var(--bg-elevated);
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.tool-card__icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  line-height: 1;
}

.tool-card__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.tool-card__name {
  font-weight: 500;
  font-size: 0.95rem;
  color: var(--text);
}

.tool-card__desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.tool-card__arrow {
  font-size: 1rem;
  color: var(--accent);
  opacity: 0;
  transform: translateX(-4px);
  transition: var(--transition);
  flex-shrink: 0;
}

.tool-card:hover .tool-card__arrow {
  opacity: 1;
  transform: translateX(0);
}
</style>
