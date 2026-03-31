/**
 * 将 DEV 分节中 ```sql``` 内的「SQL 注释体」转为 Markdown 源码，供 marked 渲染。
 * 支持块注释、行注释（--），并尽量补全 GFM 表格分隔行。
 */

function isTableRow(s) {
  const t = (s || '').trim()
  return t.startsWith('|') && t.endsWith('|') && t.length > 2
}

function isSeparatorRow(s) {
  const t = (s || '').trim()
  if (!t.startsWith('|')) return false
  const cells = t.split('|').filter((c) => c.trim() !== '')
  return cells.length > 0 && cells.every((c) => /^:?-+:?$/.test(c.trim()))
}

function countTableCols(s) {
  return (s || '').split('|').filter((c) => c.trim() !== '').length
}

export function insertGfmTableSeparator(md) {
  const lines = md.split('\n')
  const out = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const prev = i > 0 ? lines[i - 1] : ''
    const next = lines[i + 1]
    out.push(line)
    if (!next || !isTableRow(line) || !isTableRow(next)) continue
    if (isSeparatorRow(line) || isSeparatorRow(next)) continue
    if (isTableRow(prev)) continue
    const c0 = countTableCols(line)
    const c1 = countTableCols(next)
    if (c0 >= 2 && c0 === c1) {
      out.push('|' + Array(c0).fill(' --- ').join('|') + '|')
    }
  }
  return out.join('\n')
}

/**
 * @param {string} raw 从模板解析出的 sql 字段原文
 * @returns {string} Markdown 字符串
 */
export function devSqlToMarkdown(raw) {
  let s = (raw || '').trim()
  if (!s) return ''

  if (s.startsWith('/*')) {
    const end = s.lastIndexOf('*/')
    if (end > 2) {
      s = s.slice(2, end)
      s = s.replace(/^\s*\*\s?/gm, '')
      s = s.trim()
    }
  } else {
    s = s
      .split('\n')
      .map((line) => {
        const m = line.match(/^\s*--\s?(.*)$/)
        return m ? m[1] : line
      })
      .join('\n')
  }

  s = s.trim()
  s = normalizeMarkdownSpacing(s)
  return insertGfmTableSeparator(s)
}

/** 合并过多空行，便于 marked 分段 */
function normalizeMarkdownSpacing(md) {
  return md.replace(/\n{3,}/g, '\n\n')
}
