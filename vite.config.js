import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base 配置说明：
// - './' 相对路径，适用于 GitHub Pages 项目页面（推荐）
// - '/' 绝对路径，适用于用户/组织页面（仓库名为 username.github.io）
export default defineConfig({
  plugins: [vue()],
  base: './',
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
            if (id.includes('marked') || id.includes('dompurify')) {
              return 'vendor-markdown'
            }
          }
          return undefined
        },
      },
    },
  },
})
