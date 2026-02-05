<script setup>
import { computed } from 'vue'

const props = defineProps({
  config: { type: Object, default: () => ({}) },
})

const show = computed(() => Boolean(props.config?.enabled))

const useHtml = computed(() => props.config?.html?.trim())
const useImage = computed(
  () =>
    !useHtml.value &&
    props.config?.image?.src &&
    props.config?.image?.url
)
const useLink = computed(
  () =>
    !useHtml.value &&
    !useImage.value &&
    props.config?.link?.text &&
    props.config?.link?.url
)
</script>

<template>
  <aside v-if="show && (useHtml || useImage || useLink)" class="ad-slot" aria-label="广告">
    <div v-if="useHtml" class="ad-slot__html" v-html="config.html" />
    <a
      v-else-if="useImage"
      :href="config.image.url"
      target="_blank"
      rel="noopener noreferrer sponsored"
      class="ad-slot__image"
    >
      <img :src="config.image.src" :alt="config.image.alt || '广告'" loading="lazy" />
    </a>
    <a
      v-else-if="useLink"
      :href="config.link.url"
      target="_blank"
      rel="noopener noreferrer sponsored"
      class="ad-slot__link"
    >
      {{ config.link.text }}
    </a>
  </aside>
</template>

<style scoped>
.ad-slot {
  margin-top: 2rem;
  padding: 1rem 0;
  border-top: 1px solid var(--border-subtle);
}

.ad-slot__html {
  min-height: 60px;
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
  height: auto;
  max-height: 120px;
  object-fit: contain;
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
</style>
