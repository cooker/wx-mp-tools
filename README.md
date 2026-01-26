# 工具导航 · 静态网站

基于 Vue 3 + Vite 的工具导航页，**仅改配置文件即可更新内容**，无需动组件代码。

## 快速开始

```bash
npm install
npm run dev
```

访问 http://localhost:5173 查看效果。

## 构建静态站点

```bash
npm run build
```

产物在 `dist/`，可部署到任意静态托管（Vercel、Netlify、GitHub Pages 等）。

## 自动部署到 GitHub Pages

项目已配置 GitHub Actions，每次推送到 `main` 或 `master` 分支会自动构建并部署到 GitHub Pages。

### 首次设置

1. **启用 GitHub Pages**：
   - 进入仓库 Settings → Pages
   - Source 选择 "GitHub Actions"

2. **推送代码**：
   ```bash
   git add .
   git commit -m "初始化项目"
   git push origin main
   ```

3. **查看部署**：
   - 在仓库的 Actions 标签页查看构建状态
   - 部署完成后，访问 `https://cooker.github.io/仓库名/` 查看站点

### 后续更新

只需修改 `src/config/nav.config.js` 并提交，GitHub Actions 会自动：
- 安装依赖
- 构建项目
- 部署到 GitHub Pages

```bash
# 修改配置后
git add src/config/nav.config.js
git commit -m "更新导航配置"
git push
```

### 手动触发

在 GitHub 仓库的 Actions 标签页，选择 "构建并部署到 GitHub Pages" 工作流，点击 "Run workflow" 可手动触发部署。

## 快速配置

所有导航内容由 **`src/config/nav.config.js`** 控制，编辑该文件即可。

### 站点信息

```js
site: {
  title: '工具导航',        // 页面标题
  description: '...',      // 副标题/描述（可选）
}
```

### 分类与链接

```js
categories: [
  {
    id: 'dev',             // 唯一 id，用于无障碍等
    name: '开发工具',       // 分类名称
    icon: '⚙️',            // 可选，emoji
    items: [
      {
        name: 'GitHub',
        url: 'https://github.com',
        desc: '代码托管与协作',   // 可选
        icon: '🐙',              // 可选
      },
      // ...
    ],
  },
  // 更多分类...
]
```

- **分类**：`id`、`name` 必填；`icon` 可选。
- **链接**：`name`、`url` 必填；`desc`、`icon` 可选。

增删分类、改链接，保存后刷新页面即可生效。

## 项目结构

```
├── src/
│   ├── config/
│   │   └── nav.config.js   ← 配置入口
│   ├── components/
│   │   ├── ToolCard.vue
│   │   └── CategorySection.vue
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── index.html
├── package.json
└── vite.config.js
```

## 技术栈

- Vue 3（Composition API）
- Vite 5
- 纯静态，无后端
