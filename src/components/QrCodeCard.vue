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
    <div class="qr-card__img-wrap">
      <img
        :src="src"
        :alt="title"
        class="qr-card__img"
        loading="lazy"
      />
    </div>
    <p v-if="desc" class="qr-card__desc">{{ desc }}</p>
  </div>
</template>

<style scoped>
.qr-card {
  position: relative;
  z-index: 0;
  padding: 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  text-align: center;
}

.qr-card:hover {
  z-index: 100;
}

.qr-card__title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.75rem;
}

.qr-card__img-wrap {
  position: relative;
  overflow: visible;
  border-radius: var(--radius);
  margin: 0 auto;
  display: inline-block;
}

.qr-card__img {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  border-radius: var(--radius);
  transition: transform 0.2s ease;
}

.qr-card:hover .qr-card__img {
  transform: scale(1.15);
}

.qr-card__desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
  margin-bottom: 0;
}
</style>
