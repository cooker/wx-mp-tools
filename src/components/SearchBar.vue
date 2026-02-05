<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  expanded: { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue', 'update:expanded'])

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
  (v) => emit('update:modelValue', v)
)

const showInput = computed(() => props.expanded || !isMobile.value)
</script>

<template>
  <div class="search-bar">
    <button
      v-if="isMobile && !expanded"
      type="button"
      class="search-bar__toggle"
      aria-label="展开搜索"
      @click="emit('update:expanded', true)"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    </button>
    <div v-show="showInput" class="search-bar__wrap">
      <input
        v-model="local"
        type="search"
        class="search-bar__input"
        placeholder="搜索工具名称或描述…"
        inputmode="search"
        autocomplete="off"
        aria-label="搜索工具"
      />
      <svg class="search-bar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <button
        v-if="isMobile && expanded"
        type="button"
        class="search-bar__close"
        aria-label="收起搜索"
        @click="emit('update:expanded', false)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  min-width: 48px;
  min-height: 48px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-muted);
  transition: border-color var(--transition), color var(--transition);
}
.search-bar__toggle:hover {
  border-color: var(--accent);
  color: var(--text);
}
.search-bar__toggle svg {
  width: 22px;
  height: 22px;
}

.search-bar__wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-bar__input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  font-size: 1rem;
  color: var(--text);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: border-color var(--transition);
}
.search-bar__input::placeholder {
  color: var(--text-muted);
}
.search-bar__input:focus {
  border-color: var(--accent);
  outline: none;
  box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.2);
}

.search-bar__icon {
  position: absolute;
  left: 1rem;
  width: 1.1rem;
  height: 1.1rem;
  color: var(--text-muted);
  pointer-events: none;
}

.search-bar__close {
  position: absolute;
  right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: var(--text-muted);
  border-radius: 8px;
  transition: color var(--transition), background var(--transition);
}
.search-bar__close:hover {
  color: var(--text);
  background: var(--hover-overlay);
}
.search-bar__close svg {
  width: 18px;
  height: 18px;
}
</style>
