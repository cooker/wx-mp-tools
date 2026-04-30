import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// base 配置说明：
// - './' 相对路径，适用于 GitHub Pages 项目页面（推荐）
// - '/' 绝对路径，适用于用户/组织页面（仓库名为 username.github.io）
export default defineConfig({
  plugins: [vue()],
  base: './',
  resolve: {
    alias: {
      // highlight.js 的 styles 子路径在 pnpm + package exports 下偶发无法被 Vite 解析，显式映射到磁盘文件（见终端 Failed to resolve import）
      'highlight.js/styles/github-dark-dimmed.css': path.join(
        __dirname,
        'node_modules/highlight.js/styles/github-dark-dimmed.css'
      ),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('codemirror') ||
              id.includes('@codemirror') ||
              id.includes('@lezer')
            ) {
              return 'vendor-codemirror'
            }
            if (id.includes('naive-ui')) {
              return 'vendor-naive'
            }
            if (
              id.includes('marked') ||
              id.includes('dompurify') ||
              id.includes('highlight.js')
            ) {
              return 'vendor-markdown'
            }
          }
          return undefined
        },
      },
    },
  },
})
