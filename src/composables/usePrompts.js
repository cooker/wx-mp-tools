import { ref, computed, watch, onMounted } from 'vue'
import { promptConfig } from '../config/prompt.config.js'
import { parseMarkdownWithFrontmatter } from '../utils/parseFrontmatter.js'

async function fetchPromptContent(url) {
  const res = await fetch(url)
  if (!res.ok) return null
  return res.text()
}

/**
 * 加载单个提示词：url > file > content
 */
async function loadPromptItem(item, basePath = '') {
  const base = basePath || (typeof import.meta.env?.BASE_URL === 'string' ? import.meta.env.BASE_URL : './')
  const promptBase = (base.endsWith('/') ? base : base + '/') + 'prompt/'

  if (item.url) {
    const text = await fetchPromptContent(item.url)
    if (text) {
      const { frontmatter, body } = parseMarkdownWithFrontmatter(text)
      return {
        id: item.id,
        title: frontmatter.title || item.title,
        tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : (frontmatter.tags ? [frontmatter.tags] : item.tags || []),
        content: body,
      }
    }
  }

  const fileId = item.file || item.id
  if (fileId) {
    const url = `${promptBase}${fileId}.md`
    const text = await fetchPromptContent(url)
    if (text) {
      const { frontmatter, body } = parseMarkdownWithFrontmatter(text)
      return {
        id: item.id,
        title: frontmatter.title || item.title,
        tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : (typeof frontmatter.tags === 'string' ? frontmatter.tags.split(/,\s*/) : item.tags || []),
        content: body,
      }
    }
  }

  return {
    id: item.id,
    title: item.title,
    tags: Array.isArray(item.tags) ? item.tags : [],
    content: item.content || '',
  }
}

/**
 * 提示词板块：加载、搜索、筛选
 */
export function usePrompts() {
  const loading = ref(true)
  const prompts = ref([])
  const searchQuery = ref('')
  const activeTag = ref('')
  const searchDebounced = ref('')

  function normalizeSearchText(value) {
    return String(value ?? '')
      .normalize('NFKC')
      .trim()
      .toLowerCase()
  }

  function compactSearchText(value) {
    return normalizeSearchText(value).replace(/\s+/g, '')
  }

  function isSubsequenceMatch(text, query) {
    if (!query) return true
    let qi = 0
    for (let ti = 0; ti < text.length && qi < query.length; ti += 1) {
      if (text[ti] === query[qi]) qi += 1
    }
    return qi === query.length
  }

  function collectSearchableTexts(value, bucket) {
    if (value == null) return
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      bucket.push(String(value))
      return
    }
    if (Array.isArray(value)) {
      value.forEach((item) => collectSearchableTexts(item, bucket))
      return
    }
    if (typeof value === 'object') {
      Object.values(value).forEach((item) => collectSearchableTexts(item, bucket))
    }
  }

  function getPromptSearchText(prompt) {
    const parts = []
    collectSearchableTexts(
      {
        id: prompt?.id,
        title: prompt?.title,
        tags: prompt?.tags,
        content: prompt?.content,
      },
      parts,
    )
    return normalizeSearchText(parts.join(' '))
  }

  let debounceTimer = null
  watch(searchQuery, (v) => {
    if (normalizeSearchText(v)) activeTag.value = ''
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      searchDebounced.value = normalizeSearchText(v)
    }, 300)
  }, { immediate: true })

  const allTags = computed(() => {
    const base = searchDebounced.value
      ? prompts.value.filter((p) => matchPrompt(p, searchDebounced.value))
      : prompts.value
    const set = new Set()
    base.forEach((p) => {
      (p.tags || []).forEach((t) => set.add(t))
    })
    return Array.from(set).sort()
  })

  function matchPrompt(p, q) {
    if (!q) return true
    const fullText = getPromptSearchText(p)
    const compactText = compactSearchText(fullText)
    const compactQuery = compactSearchText(q)
    return (
      fullText.includes(q) ||
      compactText.includes(compactQuery) ||
      isSubsequenceMatch(compactText, compactQuery)
    )
  }

  const filteredPrompts = computed(() => {
    const q = searchDebounced.value
    const tag = activeTag.value
    return prompts.value.filter((p) => {
      if (!matchPrompt(p, q)) return false
      if (q) return true
      if (tag && !(p.tags || []).includes(tag)) return false
      return true
    })
  })

  async function load() {
    const { enabled, items = [], autoLoadFromPublic } = promptConfig
    if (!enabled) {
      loading.value = false
      return
    }
    loading.value = true
    const base = typeof import.meta?.env?.BASE_URL === 'string' ? import.meta.env.BASE_URL : './'
    const basePath = base.endsWith('/') ? base : base + '/'
    const promptBase = basePath + 'prompt/'

    let loaded = []

    if (items.length > 0) {
      loaded = await Promise.all(items.map((item) => loadPromptItem(item, base)))
    }

    if (autoLoadFromPublic) {
      try {
        const manifestRes = await fetch(`${promptBase}manifest.json`)
        if (manifestRes.ok) {
          const fileIds = await manifestRes.json()
          const existingIds = new Set(loaded.map((p) => p.id))
          const toLoad = fileIds.filter((id) => !existingIds.has(id))
          const fromPublic = await Promise.all(
            toLoad.map((id) => loadPromptItem({ id, title: id, tags: [], content: '' }, base))
          )
          loaded = [...loaded, ...fromPublic]
        }
      } catch {
        // manifest 不存在或网络错误，忽略
      }
    }

    prompts.value = loaded.filter((p) => p.content)
    loading.value = false
  }

  onMounted(load)

  return {
    config: promptConfig,
    loading,
    prompts,
    searchQuery,
    activeTag,
    setActiveTag: (v) => { activeTag.value = v },
    allTags,
    filteredPrompts,
  }
}
