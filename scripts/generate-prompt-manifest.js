/**
 * 扫描 public/prompt/*.md 生成 manifest.json
 * 供 autoLoadFromPublic 使用，列出可自动加载的提示词文件
 */
import { readdirSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const promptDir = join(__dirname, '../public/prompt')

if (!existsSync(promptDir)) {
  process.exit(0)
}

const files = readdirSync(promptDir)
  .filter((f) => f.endsWith('.md') && f !== 'README.md')
  .map((f) => f.replace(/\.md$/, ''))
  .sort()

writeFileSync(join(promptDir, 'manifest.json'), JSON.stringify(files))
console.log('[prompt manifest] generated:', files.length, 'files', files)
