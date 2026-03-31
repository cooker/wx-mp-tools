import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { devSqlToMarkdown } from './devSqlToMarkdown.js'

marked.setOptions({
  gfm: true,
  breaks: true,
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
