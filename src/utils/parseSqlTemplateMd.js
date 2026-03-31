import { parseMarkdownWithFrontmatter } from './parseFrontmatter.js'

/** 与 SQL.md 一致的分节标题 */
export const SQL_SECTION_ORDER = ['DDL', 'SEED', 'QUERY', 'UPDATE', 'REPORT', 'DEV']

/**
 * 解析单个分节正文：### 标题 + 可选 > NOTE: + ```sql 代码块
 */
export function parseSqlTemplateBody(body) {
  const sections = {}
  const regex = /^##\s+(DDL|SEED|QUERY|UPDATE|REPORT|DEV)\s*$/m
  const parts = body.split(regex)
  for (let i = 1; i < parts.length; i += 2) {
    const key = parts[i]
    const content = (parts[i + 1] || '').trim()
    sections[key] = parseSubsections(content)
  }
  return sections
}

function parseSubsections(text) {
  if (!text) return []
  const blocks = []
  const chunks = text.split(/(?=^###\s+)/m).map((s) => s.trim()).filter(Boolean)
  for (const chunk of chunks) {
    const h = chunk.match(/^###\s+([^\n]+)/)
    if (!h) continue
    const title = h[1].trim()
    let rest = chunk.slice(h[0].length).trim()
    let note = ''
    const noteMatch = rest.match(/^>\s*NOTE:\s*(.+?)(?:\n|$)/m)
    if (noteMatch) {
      note = noteMatch[1].trim()
      rest = rest.slice(noteMatch.index + noteMatch[0].length).trim()
    }
    // 闭合围栏须单独成行，避免 DEV 块内 `-- ```json` 等行被误判为结束
    let sqlMatch = rest.match(/```sql\s*\n([\s\S]*?)^```\s*$/m)
    if (!sqlMatch) {
      sqlMatch = rest.match(/```sql\s*\n([\s\S]*?)```/)
    }
    const sql = sqlMatch ? sqlMatch[1].trim() : ''
    blocks.push({ title, note, sql })
  }
  return blocks
}

/**
 * 完整解析模板 .md：front matter + 各分节
 */
export function parseSqlTemplateMarkdown(text) {
  const { frontmatter, body } = parseMarkdownWithFrontmatter(text)
  const sections = parseSqlTemplateBody(body)
  return { meta: frontmatter, sections }
}

export function getNonEmptySectionKeys(sections) {
  return SQL_SECTION_ORDER.filter((k) => (sections[k] || []).length > 0)
}
