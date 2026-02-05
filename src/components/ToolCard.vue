<script setup>
defineProps({
  name: { type: String, required: true },
  url: { type: String, required: true },
  desc: { type: String, default: '' },
  icon: { type: String, default: '' },
  favorited: { type: Boolean, default: false },
})
defineEmits(['toggle-favorite'])
</script>

<template>
  <div class="tool-card">
    <button
      type="button"
      class="tool-card__star"
      :aria-label="favorited ? '取消收藏' : '收藏'"
      @click.stop="$emit('toggle-favorite')"
    >
      <svg v-if="favorited" class="tool-card__star-icon tool-card__star-icon--filled" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      <svg v-else class="tool-card__star-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </button>
    <a
      :href="url"
      target="_blank"
      rel="noopener noreferrer"
      class="tool-card__link"
    >
      <span v-if="icon" class="tool-card__icon" aria-hidden="true">{{ icon }}</span>
      <div class="tool-card__body">
        <span class="tool-card__name">{{ name }}</span>
        <span v-if="desc" class="tool-card__desc">{{ desc }}</span>
      </div>
      <span class="tool-card__arrow" aria-hidden="true">→</span>
    </a>
  </div>
</template>

<style scoped>
.tool-card {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  transition: border-color var(--transition), background var(--transition);
}
.tool-card:hover {
  border-color: var(--accent);
  background: var(--bg-elevated);
}

.tool-card__star {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  margin: -8px -8px 0 0;
  color: var(--text-muted);
  border-radius: 50%;
  transition: color var(--transition), transform var(--transition);
}
.tool-card__star:hover {
  color: var(--accent);
}
.tool-card__star:active {
  transform: scale(0.95);
}

.tool-card__star-icon {
  width: 20px;
  height: 20px;
}
.tool-card__star-icon--filled {
  color: var(--accent);
}

.tool-card__link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  min-height: 44px;
  border-radius: var(--radius-lg);
  text-align: left;
  cursor: pointer;
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
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.tool-card__arrow {
  font-size: 1rem;
  color: var(--accent);
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity var(--transition), transform var(--transition);
  flex-shrink: 0;
}

.tool-card__link:hover .tool-card__arrow {
  opacity: 1;
  transform: translateX(0);
}

@media (prefers-reduced-motion: reduce) {
  .tool-card__star:active {
    transform: none;
  }
}
</style>
