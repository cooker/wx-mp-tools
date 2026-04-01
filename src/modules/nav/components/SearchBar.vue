<script setup>
import { ref, computed, watch } from 'vue'
import { NButton, NInput } from 'naive-ui'

const props = defineProps({
  modelValue: { type: String, default: '' },
  expanded: { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue', 'update:expanded'])
const SEARCH_DEBUG = typeof import.meta !== 'undefined' && !!import.meta.env?.DEV

const local = ref(props.modelValue)
const isMobile = ref(false)

function checkMobile() {
  isMobile.value = typeof window !== 'undefined' && window.innerWidth < 768
}
if (typeof window !== 'undefined') {
  checkMobile()
  window.addEventListener('resize', checkMobile)
}

watch(
  () => props.modelValue,
  (v) => { local.value = v }
)
watch(
  local,
  (v) => {
    if (SEARCH_DEBUG) console.log('[search-debug] SearchBar emit update:modelValue =', v)
    emit('update:modelValue', v)
  }
)

const showInput = computed(() => props.expanded || !isMobile.value)
</script>

<template>
  <div class="search-bar">
    <n-button
      v-if="isMobile && !expanded"
      class="search-bar__toggle"
      aria-label="展开搜索"
      @click="emit('update:expanded', true)"
    >
      🔍
    </n-button>
    <div v-show="showInput" class="search-bar__wrap">
      <n-input
        v-model="local"
        type="search"
        class="search-bar__input"
        placeholder="搜索工具名称或描述…"
        aria-label="搜索工具"
        clearable
      >
        <template #prefix>🔎</template>
      </n-input>
      <n-button
        v-if="isMobile && expanded"
        class="search-bar__close"
        aria-label="收起搜索"
        @click="emit('update:expanded', false)"
      >
        ✕
      </n-button>
    </div>
  </div>
</template>

<style scoped>
.search-bar {
  position: relative;
  flex: 1;
  min-width: 0;
}

.search-bar__toggle {
  width: 48px;
  height: 48px;
}

.search-bar__wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-bar__input {
  width: 100%;
}

.search-bar__close {
  position: absolute;
  right: 0.5rem;
  width: 32px;
  height: 32px;
  min-width: 32px;
  padding: 0;
}
</style>
