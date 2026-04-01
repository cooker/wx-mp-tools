<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { NCard, NImage, NModal } from 'naive-ui'

defineProps({
  title: { type: String, required: true },
  src: { type: String, required: true },
  desc: { type: String, default: '' },
})

const showPreview = ref(false)

function openPreview() {
  showPreview.value = true
}
function closePreview() {
  showPreview.value = false
}
function onKeydown(e) {
  if (e.key === 'Escape') closePreview()
}

watch(showPreview, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <n-card class="qr-card" size="small" embedded>
    <h3 class="qr-card__title">{{ title }}</h3>
    <button
      type="button"
      class="qr-card__img-wrap"
      aria-label="点击预览大图"
      @click="openPreview"
    >
      <n-image
        :src="src"
        :alt="title"
        class="qr-card__img"
        :width="160"
        :img-props="{ loading: 'lazy' }"
        preview-disabled
      />
    </button>
    <p v-if="desc" class="qr-card__desc">{{ desc }}</p>

    <n-modal
      v-model:show="showPreview"
      preset="card"
      title="图片预览"
      class="qr-preview-modal"
      style="max-width: min(92vw, 840px)"
      :bordered="false"
      size="small"
    >
      <n-image
        :src="src"
        :alt="title"
        class="qr-preview__img"
        preview-disabled
      />
    </n-modal>
  </n-card>
</template>

<style scoped>
.qr-card {
  position: relative;
  padding: 1rem;
  text-align: center;
}

.qr-card__title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.75rem;
}

.qr-card__img-wrap {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.qr-card__img {
  display: inline-block;
  width: 160px;
  height: 160px;
  max-width: none;
  object-fit: cover;
}

.qr-card :deep(.n-image img) {
  border-radius: 10px;
}

.qr-card__desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
  margin-bottom: 0;
}

.qr-preview__img {
  width: 100%;
  max-height: 75vh;
  object-fit: contain;
}

.qr-preview-modal :deep(.n-card__content) {
  display: flex;
  justify-content: center;
}

@media (max-width: 359px) {
  .qr-card {
    padding: 0.625rem;
  }

  .qr-card__title {
    font-size: 0.82rem;
    margin-bottom: 0.5rem;
  }

  .qr-card__desc {
    font-size: 0.75rem;
    margin-top: 0.375rem;
  }
}
</style>
