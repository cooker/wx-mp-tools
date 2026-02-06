/**
 * 解析 .md 的 YAML frontmatter + body
 */
export function parseMarkdownWithFrontmatter(text) {
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
