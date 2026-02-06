# 提示词板块 · 初步设计

基于用户需求：独立区块、卡片列表、复制/搜索/筛选、多标签分类、延展现有 Minimalism 深色风格。

---

## 1. 需求概要

| 维度 | 选择 |
|------|------|
| 展示位置 | 独立区块（主内容区，非侧边栏） |
| 展示形态 | 卡片列表 |
| 核心交互 | 一键复制、搜索、筛选 |
| 分类 | 支持多标签 |
| 数据来源 | prompt.config.js + public/prompt/*.md + 可选 URL |
| 前端风格 | 延展现有 Minimalism 深色主题 |

---

## 2. 配置与数据

### 2.1 配置文件 `src/config/prompt.config.js`

```js
{
  enabled: true,
  title: '开发提示词',
  autoLoadFromPublic: true,
  items: [
    { id, title, tags[], content?, url?, file? }
  ]
}
```

- **url**：有值时从远程拉取内容，覆盖 content
- **file**：从 `/prompt/{file}.md` 加载，省略时用 `id`
- **content**：内联兜底
- **优先级**：url > file（本地 .md）> content

### 2.2 `public/prompt/*.md` 格式

```md
---
title: 代码审查
tags: 代码, 测试
---

提示词正文...
```

- 单层目录，无子文件夹
- YAML frontmatter + 正文
- 构建时可通过脚本扫描生成 `manifest.json`，供 `autoLoadFromPublic` 使用

### 2.3 加载逻辑

1. 以 `prompt.config.js` 的 `items` 为基础
2. 若 `autoLoadFromPublic` 为 true：请求 `/prompt/manifest.json` 获取文件列表，逐条 fetch `.md` 并解析
3. 若 item 有 `url`：fetch 远程内容
4. 若 item 有 `file` 或 `id`：fetch `/prompt/{file|id}.md`，存在则用其内容

---

## 3. 布局结构

```
┌─────────────────────────────────────────────────────────────────┐
│  Header + 搜索 + 筛选（工具导航区）                                │
├─────────────────────────────────────────────────────────────────┤
│  主内容（工具卡片）  │  侧边栏（公告、赞赏码、群码）                │
├─────────────────────────────────────────────────────────────────┤
│  ═══ 提示词板块（独立区块，全宽） ═══                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  开发提示词                                                   ││
│  │  [ 搜索框 ]              [ 全部 | 代码 | 测试 | … ]  筛选     ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          ││
│  │  │ 代码审查  [复制]│ │ 代码解释  [复制]│ │ 生成单测  [复制]│          ││
│  │  │ #代码         │ │ #代码         │ │ #测试 #代码   │          ││
│  │  │ 请作为资深... │ │ 请逐行解释... │ │ 请为以下...   │          ││
│  │  └──────────────┘ └──────────────┘ └──────────────┘          ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│  底部广告位                                                      │
└─────────────────────────────────────────────────────────────────┘
```

- 提示词区块在工具导航与底部广告之间
- 全宽展示，移动端单列

---

## 4. 组件拆分

| 组件 | 职责 |
|------|------|
| `PromptSection.vue` | 区块容器，集成搜索、筛选、卡片网格 |
| `PromptCard.vue` | 单张提示词卡片：标题、标签、内容预览、复制按钮 |
| `PromptSearchBar.vue` | 可选复用 SearchBar 或轻量输入框 |
| `PromptFilterTabs.vue` | 标签筛选，从所有 items 的 tags 去重生成 |
| `composables/usePrompts.js` | 加载逻辑（config + url + file + manifest）、搜索/筛选计算 |

---

## 5. 视觉规范（延展 Minimalism 深色）

### 5.1 色彩

沿用 `style.css` 变量：

| 用途 | 变量 |
|------|------|
| 卡片背景 | `--bg-card` |
| 边框 | `--border` |
| 正文 | `--text` |
| 次要 | `--text-muted` |
| 强调/链接 | `--accent` |
| 悬浮 | `--hover-overlay` |

### 5.2 提示词卡片

- 背景：`var(--bg-card)`，边框 `1px solid var(--border)`
- 圆角：`var(--radius-lg)`（8px）
- 内边距：`1rem 1.25rem`
- Hover：`border-color: var(--accent)`，`background: var(--bg-elevated)`
- 内容预览：2–3 行，`-webkit-line-clamp`，`--text-muted`，`font-size: 0.9rem`

### 5.3 复制按钮

- 位置：卡片右上或标题右侧
- 图标：SVG 复制（clipboard），不用 emoji
- 触摸区域：≥ 44×44px
- 复制成功：短暂文案「已复制」或 toast，150–200ms

### 5.4 标签

- 胶囊形：`border-radius: 9999px`
- 字号：`0.75rem`，字重 500
- 背景：`rgba(255,255,255,0.08)`，边框 `var(--border-subtle)`
- 筛选标签选中：`color: var(--accent)`，`border-color: var(--accent)`

### 5.5 搜索框

- 与主工具栏 SearchBar 风格一致
- 占位符：「搜索提示词…」
- Debounce：300ms

### 5.6 空态

- 无结果：「暂无匹配的提示词」
- 副文案：「试试其他关键词或切换分类」

---

## 6. 交互

| 交互 | 说明 |
|------|------|
| 复制 | 点击复制按钮 → `navigator.clipboard.writeText(content)` → 短暂「已复制」反馈 |
| 搜索 | 输入 debounce 300ms → 过滤 title、content、tags |
| 筛选 | 点击标签 → 只显示含该 tag 的提示词，「全部」显示所有 |
| 展开 | 可选：点击卡片展开全文，或默认展示预览+复制 |

---

## 7. 动效

- 卡片 Hover：`transition: 200ms ease`（与现有一致）
- 复制反馈：150ms 淡入/淡出
- 支持 `prefers-reduced-motion: reduce`

---

## 8.  accessibility

- 复制按钮：`aria-label="复制提示词"`
- 筛选标签：`aria-pressed` 表示选中
- 搜索框：`aria-label` 或关联 `label`
- 键盘可聚焦、Tab 顺序合理

---

## 9. 实施顺序

1. **P0**：`usePrompts` 加载逻辑（config + file，暂不实现 manifest）
2. **P1**：`PromptCard`（标题、标签、预览、复制）
3. **P2**：`PromptSection` 布局、搜索、筛选
4. **P3**：`autoLoadFromPublic` + manifest 构建脚本（若需要）
5. **P4**：URL 远程拉取支持

---

*延展现有 Minimalism 深色主题，与工具导航保持一致。*
