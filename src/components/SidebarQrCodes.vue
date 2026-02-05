<script setup>
import { computed } from 'vue'
import QrCodeCard from './QrCodeCard.vue'

const props = defineProps({
  rewardCode: { type: Object, default: () => ({}) },
  groupCode: { type: Object, default: () => ({}) },
})

const showReward = computed(
  () => Boolean(props.rewardCode?.enabled && props.rewardCode?.src)
)
const showGroup = computed(
  () => Boolean(props.groupCode?.enabled && props.groupCode?.src)
)
const show = computed(() => showReward.value || showGroup.value)
</script>

<template>
  <div v-if="show" class="qr-codes">
    <QrCodeCard
      v-if="showReward"
      :title="rewardCode.title || '赞赏'"
      :src="rewardCode.src"
      :desc="rewardCode.desc"
    />
    <QrCodeCard
      v-if="showGroup"
      :title="groupCode.title || '交流群'"
      :src="groupCode.src"
      :desc="groupCode.desc"
    />
  </div>
</template>

<style scoped>
.qr-codes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .qr-codes {
    grid-template-columns: 1fr;
    max-width: 220px;
  }
}
</style>
