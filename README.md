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

只需修改 `src/config/nav.config.js` 或 `src/config/prompt.config.js` 并提交，GitHub Actions 会自动：
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

## 功能

- **搜索**：输入关键词实时过滤工具名称和描述（300ms debounce）
- **分类筛选**：按分类筛选，支持「全部」
- **收藏**：点击工具卡片右上角星形收藏，数据保存在 `localStorage`
- **开发提示词**：独立页面，支持搜索、按标签筛选、一键复制，可从顶部导航或工具卡片进入
- **站内链接**：工具链接可配置 `internal: true` 实现站内跳转（不新开标签）
- **二维码预览**：点击赞赏码/群码图片可全屏预览，支持 ESC、点击遮罩、关闭按钮退出
- **广告轮播**：底部广告位支持多个广告配置，自动轮播
- **隐私协议/服务条款**：提供 `privacy.html`、`terms.html` 静态页面，并在页脚提供入口

## 快速配置

- **工具导航**：`src/config/nav.config.js`
- **开发提示词**：`src/config/prompt.config.js`、`public/prompt/*.md`

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
    size: 'md',            // 可选，bento 宽度：sm | md | lg
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
- **链接**：`name`、`url` 必填；`desc`、`icon` 可选；`internal` 可选（设为 `true` 为站内链接，不新开标签）。

增删分类、改链接，保存后刷新页面即可生效。

### 底部广告位

支持**多个广告轮播**，在 `nav.config.js` 中配置 `ad.items`，每项可选 `html` / `image` / `link`（按优先级）：

```js
ad: {
  enabled: true,
  interval: 5000,   // 轮播间隔（ms），默认 5000
  items: [
    { image: { src: 'https://...', url: 'https://...', alt: '广告' } },
    { link: { text: '赞助商链接', url: 'https://...' } },
    { html: '<div class="ad-unit">...</div>' },
  ],
}
```

- **图片尺寸**：展示区域宽 100%、高 120px，`object-fit: fill` 平铺拉伸填充。推荐素材 **1200×120**（10:1）或 **1200×80**（15:1）横版长图，任意尺寸均可但比例接近可减少拉伸变形
- 兼容旧格式：未配置 `items` 时，顶层 `image` / `html` / `link` 仍可用（单广告）
- 多个广告时自动轮播，底部显示圆点可点击切换
- 不需要广告时，将 `enabled` 设为 `false`

### 右侧公告

在 `nav.config.js` 中配置 `notices`，支持多条公告，每条可设置点击跳转：

```js
notices: {
  enabled: true,        // 是否展示公告
  title: '公告',        // 公告标题（可选）
  items: [
    {
      title: '新功能上线',              // 公告标题
      content: '新增多个实用工具',      // 公告内容（可选）
      url: 'https://example.com',      // 点击跳转链接（可选，不填则不跳转）
      date: '2024-01-15',              // 发布日期（可选）
    },
    // 更多公告...
  ],
}
```

- 公告显示在页面右侧，小屏幕时自动移到顶部
- 支持 `sticky` 定位，滚动时保持可见
- 不需要公告时，将 `enabled` 设为 `false` 或移除 `notices` 配置即可

### 赞赏码与群码

在公告下方展示赞赏码、群码二维码，配置 `rewardCode`、`groupCode`：

```js
rewardCode: {
  enabled: true,
  title: '赞赏',
  src: 'https://你的图床/赞赏码.png',
  desc: '请作者喝杯咖啡',
},

groupCode: {
  enabled: true,
  title: '交流群',
  src: 'https://你的图床/群码.png',
  desc: '扫码加入交流群',
},
```

- `enabled` 为 `true` 且 `src` 有值时展示
- 不需要时，将 `enabled` 设为 `false` 即可

### 开发提示词

提示词为**独立页面**，编辑 `src/config/prompt.config.js` 或 `public/prompt/*.md` 维护。

**入口**：顶部导航「提示词」、开发工具分类中的「开发提示词」卡片

**配置**（`src/config/prompt.config.js`）：

```js
export const promptConfig = {
  enabled: true,         // 是否展示提示词板块及导航入口
  title: '开发提示词',   // 板块标题
  items: [
    {
      id: 'code-review',           // 唯一标识
      title: '代码审查',            // 提示词名称
      tags: ['代码'],              // 分类标签（支持多标签）
      content: '请作为资深开发者...',  // 内联内容
      // url: 'https://...',       // 可选：从远程 URL 拉取
      // file: 'code-review',      // 可选：从 /prompt/code-review.md 加载
    },
  ],
}
```

- `enabled` 为 `false` 时，顶部导航和工具卡片中的提示词入口会隐藏

**数据优先级**：`url` > `file`（本地 .md）> `content`

**`autoLoadFromPublic: true`**：自动加载 `public/prompt/` 下所有 `.md` 文件（除 README.md），无需在 `items` 中逐条配置。构建时会生成 `manifest.json` 供运行时读取。`items` 中的配置仍会加载，与自动发现的结果合并（自动发现不会覆盖已有 id）。

**本地 .md 文件**（`public/prompt/` 目录）：

```md
---
title: 代码审查
tags: 代码, 测试
---

提示词正文内容...
```

- 支持搜索、按标签筛选、一键复制
- 新增 .md 文件后，在 `prompt.config.js` 的 `items` 中增加对应条目即可

## 项目结构

```
├── src/
│   ├── config/              ← 配置（保留）
│   │   ├── nav.config.js
│   │   └── prompt.config.js
│   ├── modules/             ← 按功能模块
│   │   ├── nav/             ← 工具导航
│   │   │   ├── HomeView.vue
│   │   │   └── components/   CategorySection, FilterTabs, SearchBar, ToolCard
│   │   ├── prompts/         ← 提示词
│   │   │   ├── PromptsView.vue
│   │   │   └── components/   PromptSection, PromptCard
│   │   └── shared/          ← 公告/广告/二维码
│   │       └── AdSlot, NoticeBoard, SidebarQrCodes, QrCodeCard
│   ├── composables/         useFavorites, usePrompts
│   ├── router/              index.js（单文件）
│   ├── styles/              ← 集中样式
│   │   ├── variables.css
│   │   └── global.css
│   ├── utils/                ← 纯函数
│   │   ├── parseFrontmatter.js
│   │   └── formatDate.js
│   ├── App.vue
│   ├── main.js
│   └── style.css            ← 入口，@import styles/*
├── public/prompt/
├── scripts/                  generate-prompt-manifest.js
└── ...
```

## 技术栈

- Vue 3（Composition API）
- Vue Router 5（Hash 模式，适配 GitHub Pages）
- Vite 5
- 纯静态，无后端
