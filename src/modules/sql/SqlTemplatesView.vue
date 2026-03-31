<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { sql } from '@codemirror/lang-sql'
import { oneDark } from '@codemirror/theme-one-dark'
import { format } from 'sql-formatter'
import { useSqlTemplates } from '../../composables/useSqlTemplates.js'
import { SQL_SECTION_ORDER } from '../../utils/parseSqlTemplateMd.js'
import { renderDevMarkdownHtml } from '../../utils/renderDevMarkdown.js'

/** 供模板遍历分节 Tab（与 SQL.md 一致） */
const sectionOrder = SQL_SECTION_ORDER

const router = useRouter()
const { loading, error, templates } = useSqlTemplates()

const selectedId = ref('')
const activeSection = ref('')
const blockIndex = ref(0)
const editorHost = ref(null)
let editorView = null
/** DDL 多分块时每块一个 EditorView */
const ddlEditors = new Map()

watch(
  templates,
  (list) => {
    if (!list.length) return
    if (!selectedId.value || !list.some((t) => t.id === selectedId.value)) {
      selectedId.value = list[0].id
    }
  },
  { immediate: true }
)

const selectedTemplate = computed(() =>
  templates.value.find((t) => t.id === selectedId.value)
)

watch(
  selectedTemplate,
  (t) => {
    if (!t?.sectionKeys?.length) {
      activeSection.value = ''
      return
    }
    if (!activeSection.value || !t.sectionKeys.includes(activeSection.value)) {
      activeSection.value = t.sectionKeys[0]
    }
  },
  { immediate: true }
)

watch(activeSection, () => {
  blockIndex.value = 0
})

const currentBlocks = computed(() => {
  const t = selectedTemplate.value
  if (!t || !activeSection.value) return []
  return t.sections[activeSection.value] || []
})

const currentSql = computed(() => {
  const blocks = currentBlocks.value
  const b = blocks[blockIndex.value]
  return b?.sql || ''
})

const isDdlSection = computed(() => activeSection.value === 'DDL')
const isDevSection = computed(() => activeSection.value === 'DEV')

function sqlEditorExtensions(scrollerMax = 'min(55vh, 480px)') {
  return [
    basicSetup,
    sql(),
    oneDark,
    EditorView.theme({
      '&': { fontSize: '13px' },
      '.cm-editor': { borderRadius: 'var(--radius)' },
      '.cm-scroller': { minHeight: '240px', maxHeight: scrollerMax },
    }),
  ]
}

function destroyEditor() {
  if (editorView) {
    editorView.destroy()
    editorView = null
  }
}

function destroyAllDdlEditors() {
  ddlEditors.forEach((v) => v.destroy())
  ddlEditors.clear()
}

function ddlAnchorId(index) {
  const id = selectedId.value || 'tpl'
  return `sql-ddl-${id}-${index}`
}

function devAnchorId(index) {
  const id = selectedId.value || 'tpl'
  return `sql-dev-${id}-${index}`
}

function scrollToDevFragment(index) {
  const el = document.getElementById(devAnchorId(index))
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function scrollToDdlFragment(index) {
  const el = document.getElementById(ddlAnchorId(index))
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function bindDdlEditorHost(el, index) {
  if (!el) {
    const v = ddlEditors.get(index)
    if (v) {
      v.destroy()
      ddlEditors.delete(index)
    }
    return
  }
  const blocks = currentBlocks.value
  const sqlText = blocks[index]?.sql ?? ''
  if (ddlEditors.has(index)) {
    const v = ddlEditors.get(index)
    if (v.dom.parentElement !== el) {
      v.destroy()
      ddlEditors.delete(index)
    } else {
      const cur = v.state.doc.toString()
      if (cur !== sqlText) {
        v.dispatch({
          changes: { from: 0, to: v.state.doc.length, insert: sqlText },
        })
      }
      return
    }
  }
  const view = new EditorView({
    parent: el,
    state: EditorState.create({
      doc: sqlText,
      extensions: sqlEditorExtensions('min(40vh, 400px)'),
    }),
  })
  ddlEditors.set(index, view)
}

function formatDdlFragment(index) {
  const v = ddlEditors.get(index)
  if (!v) return
  const raw = v.state.doc.toString()
  try {
    const out = format(raw, { language: 'mysql' })
    v.dispatch({
      changes: { from: 0, to: v.state.doc.length, insert: out },
    })
  } catch {
    /* ignore */
  }
}

async function copyDdlFragment(index) {
  const v = ddlEditors.get(index)
  if (!v) return
  try {
    await navigator.clipboard.writeText(v.state.doc.toString())
  } catch {
    /* ignore */
  }
}

async function copyDevRaw(index) {
  const text = currentBlocks.value[index]?.sql ?? ''
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    /* ignore */
  }
}

function createEditor() {
  if (!editorHost.value || editorView) return
  editorView = new EditorView({
    parent: editorHost.value,
    state: EditorState.create({
      doc: currentSql.value || '',
      extensions: sqlEditorExtensions(),
    }),
  })
}

function syncDoc() {
  if (!editorView) return
  const next = currentSql.value || ''
  const cur = editorView.state.doc.toString()
  if (cur === next) return
  editorView.dispatch({
    changes: { from: 0, to: editorView.state.doc.length, insert: next },
  })
}

function ensureEditor() {
  nextTick(() => {
    if (isDdlSection.value || isDevSection.value) return
    if (!editorHost.value) return
    if (!editorView) createEditor()
    syncDoc()
  })
}

watch(currentSql, () => {
  ensureEditor()
})

watch(templates, (list) => {
  if (list.length) ensureEditor()
}, { immediate: true })

onMounted(() => {
  ensureEditor()
})

onBeforeUnmount(() => {
  destroyEditor()
  destroyAllDdlEditors()
})

watch(activeSection, (s) => {
  if (s === 'DDL' || s === 'DEV') {
    destroyEditor()
  } else {
    destroyAllDdlEditors()
    ensureEditor()
  }
})

watch(selectedId, () => {
  destroyAllDdlEditors()
  if (!isDdlSection.value) {
    destroyEditor()
    ensureEditor()
  }
})

function onFormat() {
  if (!editorView) return
  const raw = editorView.state.doc.toString()
  try {
    const out = format(raw, { language: 'mysql' })
    editorView.dispatch({
      changes: { from: 0, to: editorView.state.doc.length, insert: out },
    })
  } catch {
    /* ignore */
  }
}

async function onCopy() {
  if (!editorView) return
  const text = editorView.state.doc.toString()
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    /* ignore */
  }
}

const metaMissing = computed(() => {
  const m = selectedTemplate.value?.meta || {}
  const need = ['code', 'name', 'bizType', 'version', 'description']
  return need.filter((k) => !String(m[k] ?? '').trim())
})
</script>

<template>
  <div class="sql-view">
    <a href="#/" class="sql-view__back" @click.prevent="router.push('/')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      <span>返回工具导航</span>
    </a>

    <h1 class="sql-view__title">SQL 模板</h1>
    <p class="sql-view__hint">模板来自 <code>public/sql-templates/</code>，约定见仓库根目录 <code>SQL.md</code>。</p>

    <div v-if="loading" class="sql-view__state">加载中…</div>
    <div v-else-if="error" class="sql-view__state sql-view__state--err">{{ error }}</div>
    <div v-else-if="!templates.length" class="sql-view__state">暂无模板，请在 <code>public/sql-templates/</code> 添加 <code>.md</code> 并更新清单。</div>

    <div v-else class="sql-layout">
      <aside class="sql-layout__side" aria-label="模板列表">
        <h2 class="sql-layout__side-title">模板</h2>
        <ul class="sql-layout__list">
          <li v-for="t in templates" :key="t.id">
            <button
              type="button"
              class="sql-layout__item"
              :class="{ 'sql-layout__item--active': t.id === selectedId }"
              @click="selectedId = t.id"
            >
              {{ t.meta.name || t.id }}
            </button>
          </li>
        </ul>
      </aside>

      <div v-if="selectedTemplate" class="sql-layout__main">
        <div v-if="metaMissing.length" class="sql-view__warn">
          缺少 front matter 字段：{{ metaMissing.join('、') }}（见 SQL.md）
        </div>

        <dl class="sql-meta">
          <div v-if="selectedTemplate.meta.code" class="sql-meta__row">
            <dt>code</dt>
            <dd>{{ selectedTemplate.meta.code }}</dd>
          </div>
          <div v-if="selectedTemplate.meta.bizType" class="sql-meta__row">
            <dt>bizType</dt>
            <dd>{{ selectedTemplate.meta.bizType }}</dd>
          </div>
          <div v-if="selectedTemplate.meta.version" class="sql-meta__row">
            <dt>version</dt>
            <dd>{{ selectedTemplate.meta.version }}</dd>
          </div>
          <div v-if="selectedTemplate.meta.description" class="sql-meta__row sql-meta__row--full">
            <dt>description</dt>
            <dd>{{ selectedTemplate.meta.description }}</dd>
          </div>
        </dl>

        <div class="sql-tabs" role="tablist" :aria-label="`SQL 分节：${selectedTemplate.meta.name || selectedTemplate.id}`">
          <button
            v-for="key in sectionOrder"
            :key="key"
            type="button"
            role="tab"
            class="sql-tabs__tab"
            :class="{ 'sql-tabs__tab--active': key === activeSection }"
            :disabled="!selectedTemplate.sectionKeys.includes(key)"
            :aria-selected="key === activeSection"
            @click="activeSection = key"
          >
            {{ key }}
          </button>
        </div>

        <div v-if="activeSection === 'DDL' && currentBlocks.length" class="sql-blocks sql-blocks--ddl">
          <p class="sql-blocks__anchor-hint">点击下方标签可滚动到对应片段</p>
          <div class="sql-blocks__list" role="list">
            <button
              v-for="(b, i) in currentBlocks"
              :key="i"
              type="button"
              class="sql-blocks__chip sql-blocks__chip--anchor"
              @click="scrollToDdlFragment(i)"
            >
              {{ b.title || `片段 ${i + 1}` }}
            </button>
          </div>
          <div class="sql-ddl__stack">
            <article
              v-for="(b, i) in currentBlocks"
              :id="ddlAnchorId(i)"
              :key="`${selectedId}-ddl-${i}`"
              class="sql-ddl__fragment"
            >
              <h3 class="sql-ddl__fragment-title">{{ b.title || `片段 ${i + 1}` }}</h3>
              <p v-if="b.note" class="sql-blocks__note">{{ b.note }}</p>
              <div class="sql-editor-toolbar">
                <button type="button" class="sql-btn" @click="formatDdlFragment(i)">格式化</button>
                <button type="button" class="sql-btn" @click="copyDdlFragment(i)">复制</button>
              </div>
              <div
                class="sql-editor-host"
                :ref="(el) => bindDdlEditorHost(el, i)"
              />
            </article>
          </div>
        </div>

        <div v-else-if="activeSection === 'DEV' && currentBlocks.length" class="sql-blocks sql-blocks--dev">
          <p class="sql-blocks__anchor-hint">点击下方标签可锚点跳转；正文由注释内容渲染为 Markdown，便于阅读</p>
          <div class="sql-blocks__list" role="list">
            <button
              v-for="(b, i) in currentBlocks"
              :key="i"
              type="button"
              class="sql-blocks__chip sql-blocks__chip--anchor"
              @click="scrollToDevFragment(i)"
            >
              {{ b.title || `片段 ${i + 1}` }}
            </button>
          </div>
          <div class="sql-dev__stack">
            <article
              v-for="(b, i) in currentBlocks"
              :id="devAnchorId(i)"
              :key="`${selectedId}-dev-${i}`"
              class="sql-dev__fragment"
            >
              <h3 class="sql-ddl__fragment-title">{{ b.title || `片段 ${i + 1}` }}</h3>
              <p v-if="b.note" class="sql-blocks__note">{{ b.note }}</p>
              <div class="sql-editor-toolbar">
                <button type="button" class="sql-btn" @click="copyDevRaw(i)">复制源码</button>
              </div>
              <div
                class="sql-dev-md"
                v-html="renderDevMarkdownHtml(b.sql)"
              />
            </article>
          </div>
        </div>

        <div v-else-if="activeSection && currentBlocks.length" class="sql-blocks">
          <div class="sql-blocks__list" role="list">
            <button
              v-for="(b, i) in currentBlocks"
              :key="i"
              type="button"
              class="sql-blocks__chip"
              :class="{ 'sql-blocks__chip--active': i === blockIndex }"
              @click="blockIndex = i"
            >
              {{ b.title || `片段 ${i + 1}` }}
            </button>
          </div>
          <p v-if="currentBlocks[blockIndex]?.note" class="sql-blocks__note">
            {{ currentBlocks[blockIndex].note }}
          </p>
          <div class="sql-editor-toolbar">
            <button type="button" class="sql-btn" @click="onFormat">格式化</button>
            <button type="button" class="sql-btn" @click="onCopy">复制</button>
          </div>
          <div ref="editorHost" class="sql-editor-host" />
        </div>
        <p v-else-if="activeSection" class="sql-view__state">该分节暂无内容</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sql-view {
  animation: fadeIn 0.4s var(--transition-slow) both;
}

.sql-view__back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-muted);
  margin-bottom: 1rem;
  transition: color var(--transition);
}
.sql-view__back:hover {
  color: var(--accent);
}
.sql-view__back svg {
  width: 1.2rem;
  height: 1.2rem;
}

.sql-view__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 0.5rem;
}

.sql-view__hint {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0 0 1.25rem;
}
.sql-view__hint code {
  font-family: var(--font-mono);
  font-size: 0.85em;
}

.sql-view__state {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--text-muted);
}
.sql-view__state--err {
  color: #f85149;
}
.sql-view__warn {
  font-size: 0.85rem;
  color: #d29922;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(210, 153, 34, 0.35);
  border-radius: var(--radius);
  margin-bottom: 1rem;
}

.sql-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 1.5rem;
  align-items: start;
}

.sql-layout__side {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1rem;
  position: sticky;
  top: 1rem;
}

.sql-layout__side-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  margin: 0 0 0.75rem;
}

.sql-layout__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.sql-layout__item {
  width: 100%;
  text-align: left;
  padding: 0.5rem 0.65rem;
  font-size: 0.9rem;
  color: var(--text-muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius);
  transition: color var(--transition), border-color var(--transition), background var(--transition);
}
.sql-layout__item:hover {
  color: var(--text);
  background: var(--hover-overlay);
}
.sql-layout__item--active {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--hover-overlay);
}

.sql-layout__main {
  min-width: 0;
}

.sql-meta {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem 1rem;
  font-size: 0.85rem;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.sql-meta__row {
  display: grid;
  gap: 0.15rem;
}
.sql-meta__row--full {
  grid-column: 1 / -1;
}
.sql-meta__row dt {
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.sql-meta__row dd {
  margin: 0;
  color: var(--text);
}

.sql-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 1rem;
}

.sql-tabs__tab {
  padding: 0.45rem 0.85rem;
  min-height: 40px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: color var(--transition), border-color var(--transition);
}
.sql-tabs__tab:hover:not(:disabled) {
  color: var(--text);
}
.sql-tabs__tab--active {
  color: var(--accent);
  border-color: var(--accent);
}
.sql-tabs__tab:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.sql-blocks__anchor-hint {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0 0 0.5rem;
}

.sql-ddl__stack {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.sql-ddl__fragment {
  scroll-margin-top: 5.5rem;
}

.sql-ddl__fragment-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 0.35rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid var(--border-subtle);
}

.sql-dev__stack {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.sql-dev__fragment {
  scroll-margin-top: 5.5rem;
}

.sql-dev-md {
  font-size: 0.9rem;
  line-height: 1.65;
  color: var(--text);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1rem 1.15rem;
  max-height: min(70vh, 720px);
  overflow: auto;
}

.sql-dev-md :deep(h1) {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0.75rem 0 0.5rem;
  color: var(--text);
}
.sql-dev-md :deep(h2) {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0.65rem 0 0.4rem;
  color: var(--text);
}
.sql-dev-md :deep(h3) {
  font-size: 1rem;
  font-weight: 600;
  margin: 0.5rem 0 0.35rem;
  color: var(--text);
}
.sql-dev-md :deep(p) {
  margin: 0.45rem 0;
}
.sql-dev-md :deep(ul),
.sql-dev-md :deep(ol) {
  margin: 0.45rem 0;
  padding-left: 1.35rem;
}
.sql-dev-md :deep(li) {
  margin: 0.2rem 0;
}
.sql-dev-md :deep(hr) {
  border: none;
  border-top: 1px solid var(--border-subtle);
  margin: 1rem 0;
}
.sql-dev-md :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  margin: 0.75rem 0;
}
.sql-dev-md :deep(th),
.sql-dev-md :deep(td) {
  border: 1px solid var(--border);
  padding: 0.4rem 0.55rem;
  text-align: left;
  vertical-align: top;
}
.sql-dev-md :deep(th) {
  background: var(--hover-overlay);
  font-weight: 600;
  color: var(--text);
}
.sql-dev-md :deep(tr:nth-child(even) td) {
  background: rgba(0, 0, 0, 0.02);
}
.sql-dev-md :deep(pre) {
  margin: 0.6rem 0;
  padding: 0.75rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow-x: auto;
  font-size: 0.82rem;
  line-height: 1.5;
}
.sql-dev-md :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.88em;
  padding: 0.1em 0.35em;
  background: var(--hover-overlay);
  border-radius: 4px;
}
.sql-dev-md :deep(pre code) {
  padding: 0;
  background: transparent;
  font-size: 0.85rem;
}
.sql-dev-md :deep(blockquote) {
  margin: 0.5rem 0;
  padding: 0.35rem 0 0.35rem 0.85rem;
  border-left: 3px solid var(--accent);
  color: var(--text-muted);
}
.sql-dev-md :deep(a) {
  color: var(--accent);
  text-decoration: none;
}
.sql-dev-md :deep(a:hover) {
  text-decoration: underline;
}

.sql-blocks__list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.5rem;
}

.sql-blocks__chip {
  padding: 0.35rem 0.65rem;
  font-size: 0.8rem;
  color: var(--text-muted);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 9999px;
  transition: color var(--transition), border-color var(--transition);
}
.sql-blocks__chip:hover {
  color: var(--text);
}
.sql-blocks__chip--active {
  color: var(--accent);
  border-color: var(--accent);
}

.sql-blocks__chip--anchor {
  cursor: pointer;
}

.sql-blocks__note {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0 0 0.75rem;
}

.sql-editor-toolbar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.sql-btn {
  padding: 0.4rem 0.85rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: border-color var(--transition), color var(--transition);
}
.sql-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.sql-editor-host {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.sql-editor-host :deep(.cm-editor) {
  background: #282c34;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .sql-layout {
    grid-template-columns: 1fr;
  }
  .sql-layout__side {
    position: static;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sql-view {
    animation: none;
  }
}
</style>
