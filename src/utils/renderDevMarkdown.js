import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js/lib/core'
import sql from 'highlight.js/lib/languages/sql'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import http from 'highlight.js/lib/languages/http'
import 'highlight.js/styles/github-dark-dimmed.css'
import { devSqlToMarkdown } from './devSqlToMarkdown.js'

hljs.registerLanguage('sql', sql)
hljs.registerLanguage('mysql', sql)
hljs.registerLanguage('mariadb', sql)
hljs.registerLanguage('json', json)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('http', http)

marked.setOptions({
  gfm: true,
  breaks: true,
})

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

marked.use({
  renderer: {
    code({ text, lang }) {
      const raw = String(text).replace(/\n$/, '')
      const langKey = (lang || '').trim().toLowerCase()
      let highlighted = ''
      try {
        if (langKey && hljs.getLanguage(langKey)) {
          highlighted = hljs.highlight(raw, { language: langKey }).value
        } else {
          const auto = hljs.highlightAuto(raw, ['sql', 'json', 'http', 'bash'])
          highlighted = auto.value
        }
      } catch {
        highlighted = escapeHtml(raw)
      }
      const langClass = langKey && hljs.getLanguage(langKey) ? `language-${langKey}` : ''
      return `<pre><code class="hljs ${langClass}">${highlighted}</code></pre>`
    },
  },
})

const purifyConfig = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'ul', 'ol', 'li',
    'blockquote',
    'pre', 'code',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'strong', 'em', 'del', 'a',
    'span', 'div',
  ],
  ALLOWED_ATTR: ['href', 'title', 'class', 'id', 'target', 'rel'],
}

/**
 * @param {string} rawSql DEV 块中的 sql 原文
 * @returns {string} 可安全用于 v-html 的 HTML
 */
export function renderDevMarkdownHtml(rawSql) {
  const md = devSqlToMarkdown(rawSql)
  if (!md) return ''
  const html = marked.parse(md)
  return DOMPurify.sanitize(html, purifyConfig)
}
