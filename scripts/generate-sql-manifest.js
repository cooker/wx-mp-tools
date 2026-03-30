/**
 * 扫描 public/sql-templates/*.md 生成 manifest.json（自动生成物，请勿手工编辑 manifest）
 */
import { readdirSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dir = join(__dirname, '../public/sql-templates')

if (!existsSync(dir)) {
  process.exit(0)
}

const files = readdirSync(dir)
  .filter((f) => f.endsWith('.md') && f !== 'README.md')
  .map((f) => f.replace(/\.md$/, ''))
  .sort()

writeFileSync(join(dir, 'manifest.json'), JSON.stringify(files))
console.log('[sql-templates manifest] generated:', files.length, 'files', files)
