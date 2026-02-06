import { ref, computed, watch, onMounted } from 'vue'
import { promptConfig } from '../config/prompt.config.js'

/**
 * 解析 .md 文件的 YAML frontmatter + body
 */
function parseMarkdownWithFrontmatter(text) {
  const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/)
  if (!match) return { frontmatter: {}, body: text.trim() }
  const [, fm, body] = match
  const frontmatter = {}
  fm.split('\n').forEach((line) => {
    const m = line.match(/^(\w+):\s*(.*)$/)
    if (m) {
      let val = m[2].trim()
      if (m[1] === 'tags') val = val.split(/,\s*/).filter(Boolean)
      frontmatter[m[1]] = val
    }
  })
  return { frontmatter, body: body.trim() }
}

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

  let debounceTimer = null
  watch(searchQuery, (v) => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      searchDebounced.value = v.trim().toLowerCase()
    }, 300)
  }, { immediate: true })

  const allTags = computed(() => {
    const set = new Set()
    prompts.value.forEach((p) => {
      (p.tags || []).forEach((t) => set.add(t))
    })
    return Array.from(set).sort()
  })

  function matchPrompt(p, q) {
    if (!q) return true
    const title = (p.title || '').toLowerCase()
    const content = (p.content || '').toLowerCase()
    const tags = (p.tags || []).join(' ').toLowerCase()
    return title.includes(q) || content.includes(q) || tags.includes(q)
  }

  const filteredPrompts = computed(() => {
    const q = searchDebounced.value
    const tag = activeTag.value
    return prompts.value.filter((p) => {
      if (!matchPrompt(p, q)) return false
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
