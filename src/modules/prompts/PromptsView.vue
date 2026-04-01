<script setup>
import { useRouter } from 'vue-router'
import { NButton } from 'naive-ui'
import PromptSection from './components/PromptSection.vue'

const router = useRouter()
</script>

<template>
  <div class="prompts-view">
    <n-button quaternary class="prompts-view__back" @click="router.push('/')">
      ← 返回工具导航
    </n-button>
    <PromptSection standalone />
  </div>
</template>

<style scoped>
.prompts-view {
  animation: fadeIn 0.4s var(--transition-slow) both;
}

.prompts-view__back {
  margin-bottom: 1.5rem;
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
