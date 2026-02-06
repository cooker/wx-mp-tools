<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

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

const currentItem = computed(() => items.value[currentIndex.value] || null)
const currentType = computed(() => (currentItem.value ? getItemType(currentItem.value) : null))
const hasMultiple = computed(() => items.value.length > 1)
</script>

<template>
  <aside v-if="show && items.length" class="ad-slot" aria-label="广告">
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
            <img :src="item.image.src" :alt="item.image.alt || '广告'" loading="lazy" />
          </a>
          <a
            v-else-if="getItemType(item) === 'link'"
            :href="item.link.url"
            target="_blank"
            rel="noopener noreferrer sponsored"
            class="ad-slot__link"
          >
            {{ item.link.text }}
          </a>
        </div>
      </div>
    </div>
    <div v-if="hasMultiple" class="ad-slot__dots" role="tablist" aria-label="广告轮播">
      <button
        v-for="(_, i) in items"
        :key="i"
        type="button"
        role="tab"
        :aria-selected="i === currentIndex"
        :aria-label="`广告 ${i + 1}`"
        class="ad-slot__dot"
        :class="{ 'ad-slot__dot--active': i === currentIndex }"
        @click="goTo(i)"
      />
    </div>
  </aside>
</template>

<style scoped>
.ad-slot {
  margin-top: 2rem;
  padding: 1rem 0;
  border-top: 1px solid var(--border-subtle);
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
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  min-height: 44px;
  font-size: 0.9rem;
  color: var(--text-muted);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: border-color var(--transition), color var(--transition);
}

.ad-slot__link:hover {
  color: var(--accent);
  border-color: var(--accent);
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
  padding: 0;
  border-radius: 50%;
  background: var(--border);
  transition: background var(--transition);
}
.ad-slot__dot:hover {
  background: var(--text-muted);
}
.ad-slot__dot--active {
  background: var(--accent);
}

@media (prefers-reduced-motion: reduce) {
  .ad-slot__slide--active {
    animation: none;
  }
}
</style>
