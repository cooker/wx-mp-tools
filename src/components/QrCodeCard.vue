<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

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
  <div class="qr-card">
    <h3 class="qr-card__title">{{ title }}</h3>
    <button
      type="button"
      class="qr-card__img-wrap"
      aria-label="点击预览大图"
      @click="openPreview"
    >
      <img
        :src="src"
        :alt="title"
        class="qr-card__img"
        loading="lazy"
      />
    </button>
    <p v-if="desc" class="qr-card__desc">{{ desc }}</p>

    <!-- 预览层 -->
    <Teleport to="body">
      <Transition name="preview">
        <div
          v-if="showPreview"
          class="qr-preview"
          role="dialog"
          aria-modal="true"
          aria-label="图片预览"
          @click.self="closePreview"
        >
          <button
            type="button"
            class="qr-preview__close"
            aria-label="关闭预览"
            @click="closePreview"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <img
            :src="src"
            :alt="title"
            class="qr-preview__img"
            @click.stop
          />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.qr-card {
  position: relative;
  padding: 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  text-align: center;
}

.qr-card__title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.75rem;
}

.qr-card__img-wrap {
  display: inline-block;
  padding: 0;
  margin: 0 auto;
  background: none;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  transition: transform var(--transition);
}
.qr-card__img-wrap:hover {
  transform: scale(1.05);
}

.qr-card__img {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  border-radius: var(--radius);
  pointer-events: none;
}

.qr-card__desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
  margin-bottom: 0;
}

/* 预览层 */
.qr-preview {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.85);
  cursor: zoom-out;
}

.qr-preview__close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: color var(--transition), background var(--transition);
}
.qr-preview__close:hover {
  color: var(--text);
  background: rgba(255, 255, 255, 0.12);
}
.qr-preview__close svg {
  width: 20px;
  height: 20px;
}

.qr-preview__img {
  max-width: 90vw;
  max-height: 85vh;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: var(--radius);
  cursor: default;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.preview-enter-active,
.preview-leave-active {
  transition: opacity 0.2s ease;
}
.preview-enter-from,
.preview-leave-to {
  opacity: 0;
}
.preview-enter-active .qr-preview__img,
.preview-leave-active .qr-preview__img {
  transition: transform 0.2s ease;
}
.preview-enter-from .qr-preview__img,
.preview-leave-to .qr-preview__img {
  transform: scale(0.95);
}

@media (prefers-reduced-motion: reduce) {
  .preview-enter-active,
  .preview-leave-active {
    transition: none;
  }
  .preview-enter-from .qr-preview__img,
  .preview-leave-to .qr-preview__img {
    transform: none;
  }
}
</style>
