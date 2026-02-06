<script setup>
import { ref } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  content: { type: String, default: '' },
  tags: { type: Array, default: () => [] },
})

const copied = ref(false)
let copyTimeout = null

async function copyToClipboard() {
  if (!props.content) return
  try {
    await navigator.clipboard.writeText(props.content)
    copied.value = true
    clearTimeout(copyTimeout)
    copyTimeout = setTimeout(() => { copied.value = false }, 1500)
  } catch {
    copied.value = false
  }
}
</script>

<template>
  <div class="prompt-card">
    <button
      type="button"
      class="prompt-card__copy"
      :aria-label="copied ? '已复制' : '复制提示词'"
      :disabled="!content"
      @click="copyToClipboard"
    >
      <svg v-if="copied" class="prompt-card__copy-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
      </svg>
      <svg v-else class="prompt-card__copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
      <span class="prompt-card__copy-text">{{ copied ? '已复制' : '复制' }}</span>
    </button>
    <div class="prompt-card__body">
      <h3 class="prompt-card__title">{{ title }}</h3>
      <div v-if="tags?.length" class="prompt-card__tags">
        <span v-for="tag in tags" :key="tag" class="prompt-card__tag">{{ tag }}</span>
      </div>
      <p class="prompt-card__preview">{{ content }}</p>
    </div>
  </div>
</template>

<style scoped>
.prompt-card {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1rem 1.25rem;
  transition: border-color var(--transition), background var(--transition);
}
.prompt-card:hover {
  border-color: var(--accent);
  background: var(--bg-elevated);
}

.prompt-card__copy {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 44px;
  min-height: 44px;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-muted);
  transition: color var(--transition), background var(--transition);
  border-radius: var(--radius);
}
.prompt-card__copy:hover:not(:disabled) {
  color: var(--accent);
  background: var(--hover-overlay);
}
.prompt-card__copy:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.prompt-card__copy svg:not(.prompt-card__copy-icon) {
  display: none;
}
.prompt-card__copy-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.prompt-card__body {
  padding-right: 5rem;
}

.prompt-card__title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.prompt-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.5rem;
}

.prompt-card__tag {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.2em 0.5em;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--border-subtle);
  border-radius: 9999px;
}

.prompt-card__preview {
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (prefers-reduced-motion: reduce) {
  .prompt-card {
    transition: none;
  }
}
</style>
