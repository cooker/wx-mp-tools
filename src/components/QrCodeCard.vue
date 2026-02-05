<script setup>
defineProps({
  title: { type: String, required: true },
  src: { type: String, required: true },
  desc: { type: String, default: '' },
})
</script>

<template>
  <div class="qr-card">
    <h3 class="qr-card__title">{{ title }}</h3>
    <img
      :src="src"
      :alt="title"
      class="qr-card__img"
      loading="lazy"
    />
    <p v-if="desc" class="qr-card__desc">{{ desc }}</p>
  </div>
</template>

<style scoped>
.qr-card {
  padding: 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  text-align: center;
  transition: transform 0.2s ease;
}

.qr-card:hover {
  transform: scale(1.08);
}

.qr-card__title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.75rem;
}

.qr-card__img {
  display: block;
  width: 100%;
  max-width: 180px;
  height: auto;
  aspect-ratio: 1;
  object-fit: contain;
  margin: 0 auto;
  border-radius: var(--radius);
}

.qr-card__desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
  margin-bottom: 0;
}
</style>
