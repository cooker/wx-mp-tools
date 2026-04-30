export function formatDisplayUrl(input) {
  const raw = String(input ?? '').trim()
  if (!raw) return ''

  if (raw.startsWith('/')) return raw

  try {
    const parsed = new URL(raw)
    const host = parsed.hostname.replace(/^www\./i, '')
    const path = parsed.pathname.replace(/\/+$/, '')
    return `${host}${path === '/' ? '' : path}`
  } catch {
    return raw
  }
}
