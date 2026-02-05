import { ref, watch } from 'vue'

const STORAGE_KEY = 'tool-nav-favorites'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function save(set) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
  } catch {}
}

export function useFavorites() {
  const favorites = ref(load())

  watch(
    favorites,
    (val) => save(val),
    { deep: true }
  )

  function toggle(url) {
    const next = new Set(favorites.value)
    if (next.has(url)) {
      next.delete(url)
    } else {
      next.add(url)
    }
    favorites.value = next
  }

  function has(url) {
    return favorites.value.has(url)
  }

  return { favorites, toggle, has }
}
