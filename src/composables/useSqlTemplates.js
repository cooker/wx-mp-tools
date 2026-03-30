import { ref, computed, onMounted } from 'vue'
import { parseSqlTemplateMarkdown, getNonEmptySectionKeys } from '../utils/parseSqlTemplateMd.js'

async function fetchText(url) {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return null
  return res.text()
}

export function useSqlTemplates() {
  const loading = ref(true)
  const error = ref('')
  const rawList = ref([])

  const base = typeof import.meta.env?.BASE_URL === 'string' ? import.meta.env.BASE_URL : './'
  const sqlBase = (base.endsWith('/') ? base : base + '/') + 'sql-templates/'

  async function load() {
    loading.value = true
    error.value = ''
    try {
      const manRes = await fetch(`${sqlBase}manifest.json`, { cache: 'no-store' })
      if (!manRes.ok) {
        error.value = '无法加载模板清单'
        rawList.value = []
        return
      }
      const ids = await manRes.json()
      if (!Array.isArray(ids) || !ids.length) {
        rawList.value = []
        return
      }
      const items = await Promise.all(
        ids.map(async (id) => {
          const text = await fetchText(`${sqlBase}${id}.md?t=${Date.now()}`)
          if (!text) return null
          try {
            const parsed = parseSqlTemplateMarkdown(text)
            return { id, ...parsed }
          } catch {
            return null
          }
        })
      )
      rawList.value = items.filter(Boolean)
    } catch (e) {
      error.value = '加载失败'
      rawList.value = []
    } finally {
      loading.value = false
    }
  }

  onMounted(load)

  const templates = computed(() =>
    rawList.value.map((t) => ({
      id: t.id,
      meta: t.meta || {},
      sections: t.sections || {},
      sectionKeys: getNonEmptySectionKeys(t.sections || {}),
    }))
  )

  return {
    loading,
    error,
    templates,
    reload: load,
    sqlBase,
  }
}
