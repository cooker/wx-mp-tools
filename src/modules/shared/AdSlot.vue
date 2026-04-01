<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { NButton, NCard, NSpace } from 'naive-ui'

const props = defineProps({
  config: { type: Object, default: () => ({}) },
})

const show = computed(() => Boolean(props.config?.enabled))

/** 归一化：支持旧格式（单广告）与新格式（items 数组） */
const items = computed(() => {
  const { items: list, html, image, link } = props.config || {}
  if (Array.isArray(list) && list.length > 0) return list
  if (html?.trim() || (image?.src && image?.url) || (link?.text && link?.url)) {
    return [{ html, image, link }]
  }
  return []
})

const currentIndex = ref(0)
const interval = computed(() => Math.max(3000, Number(props.config?.interval) || 5000))
let timer = null

function goTo(i) {
  currentIndex.value = (i + items.value.length) % items.value.length
}

function startTimer() {
  stopTimer()
  if (items.value.length <= 1) return
  timer = setInterval(() => {
    goTo(currentIndex.value + 1)
  }, interval.value)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

watch(
  () => [items.value.length, interval.value],
  () => {
    currentIndex.value = 0
    startTimer()
  },
  { immediate: true }
)

onMounted(startTimer)
onUnmounted(stopTimer)

function getItemType(item) {
  if (item?.html?.trim()) return 'html'
  if (item?.image?.src && item?.image?.url) return 'image'
  if (item?.link?.text && item?.link?.url) return 'link'
  return null
}

function getImageFit(item) {
  const fit = item?.image?.fit
  const allowed = new Set(['fill', 'contain', 'cover', 'none', 'scale-down'])
  return allowed.has(fit) ? fit : 'fill'
}

function getImagePosition(item) {
  return item?.image?.position || 'center'
}

const hasMultiple = computed(() => items.value.length > 1)
</script>

<template>
  <n-card v-if="show && items.length" class="ad-slot" aria-label="广告" embedded size="small">
    <div class="ad-slot__wrap">
      <div
        v-for="(item, i) in items"
        :key="i"
        class="ad-slot__slide"
        :class="{ 'ad-slot__slide--active': i === currentIndex }"
        :aria-hidden="i !== currentIndex"
      >
        <div v-if="i === currentIndex" class="ad-slot__content">
          <div v-if="getItemType(item) === 'html'" class="ad-slot__html" v-html="item.html" />
          <a
            v-else-if="getItemType(item) === 'image'"
            :href="item.image.url"
            target="_blank"
            rel="noopener noreferrer sponsored"
            class="ad-slot__image"
          >
            <img
              :src="item.image.src"
              :alt="item.image.alt || '广告'"
              loading="lazy"
              :style="{ objectFit: getImageFit(item), objectPosition: getImagePosition(item) }"
            />
          </a>
          <n-button
            v-else-if="getItemType(item) === 'link'"
            class="ad-slot__link"
            tag="a"
            :href="item.link.url"
            target="_blank"
            rel="noopener noreferrer sponsored"
            quaternary
          >
            {{ item.link.text }}
          </n-button>
        </div>
      </div>
    </div>
    <n-space v-if="hasMultiple" class="ad-slot__dots" role="tablist" aria-label="广告轮播" justify="center" :size="8">
      <n-button
        v-for="(_, i) in items"
        :key="i"
        role="tab"
        text
        circle
        :aria-selected="i === currentIndex"
        :aria-label="`广告 ${i + 1}`"
        class="ad-slot__dot"
        :class="{ 'ad-slot__dot--active': i === currentIndex }"
        @click="goTo(i)"
      />
    </n-space>
  </n-card>
</template>

<style scoped>
.ad-slot {
  margin-top: 2rem;
}

.ad-slot :deep(.n-card__content) {
  padding-top: 14px;
  padding-bottom: 14px;
}

.ad-slot__wrap {
  position: relative;
  min-height: 60px;
}

.ad-slot__slide {
  display: none;
}
.ad-slot__slide--active {
  display: block;
  animation: adFadeIn 0.3s ease both;
}

@keyframes adFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.ad-slot__content {
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ad-slot__html {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ad-slot__html :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  border-radius: var(--radius);
}

.ad-slot__image {
  display: block;
  width: 100%;
  height: 120px;
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--border);
  transition: border-color var(--transition);
}

.ad-slot__image:hover {
  border-color: var(--accent);
}

.ad-slot__image img {
  width: 100%;
  height: 100%;
  object-fit: fill;
  vertical-align: middle;
}

.ad-slot__link {
  min-height: 40px;
}

.ad-slot__dots {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.ad-slot__dot {
  width: 8px;
  height: 8px;
  min-width: 8px;
  min-height: 8px;
  padding: 0 !important;
  border-radius: 999px;
  background: var(--border-subtle) !important;
  opacity: 1;
}
.ad-slot__dot--active {
  background: var(--accent) !important;
}

@media (prefers-reduced-motion: reduce) {
  .ad-slot__slide--active {
    animation: none;
  }
}
</style>
