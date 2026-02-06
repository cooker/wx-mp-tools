<script setup>
import { useRouter } from 'vue-router'
import PromptSection from './components/PromptSection.vue'

const router = useRouter()
</script>

<template>
  <div class="prompts-view">
    <a href="#/" class="prompts-view__back" @click.prevent="router.push('/')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      <span>返回工具导航</span>
    </a>
    <PromptSection standalone />
  </div>
</template>

<style scoped>
.prompts-view {
  animation: fadeIn 0.4s var(--transition-slow) both;
}

.prompts-view__back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-muted);
  margin-bottom: 1.5rem;
  transition: color var(--transition);
}
.prompts-view__back:hover {
  color: var(--accent);
}
.prompts-view__back svg {
  width: 1.2rem;
  height: 1.2rem;
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
  .prompts-view {
    animation: none;
  }
}
</style>
