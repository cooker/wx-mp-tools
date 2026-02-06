# 提示词文件目录

将 `.md` 文件放于此目录，支持通过 `prompt.config.js` 的 `autoLoadFromPublic` 或 `items[].file` 自动加载。

## 文件格式

```md
---
title: 提示词标题
tags: 标签1, 标签2
---

提示词正文内容...
```

- `title`：可选，缺省时使用文件名（不含 .md）
- `tags`：可选，逗号分隔，支持多分类
- 正文：`---` 后的内容为提示词文本
