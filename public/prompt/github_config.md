---
title: Github 仓库配置
tags: 代码
---

# 第一步：设置 GitHub 仓库配置 — 开发提示词

## 功能概述

在页面第一步提供「设置 GitHub 仓库配置」模块，用于配置图片的 GitHub 仓库与 CDN 展示方式。配置后可用 jsDelivr 格式 URL 展示/上传图片，并支持导出、导入、远程默认加载。

---

## 配置项与数据模型

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `owner` | string | 是 | GitHub 用户名或组织，如 `gulugulu-lab` |
| `repo` | string | 是 | 仓库名。支持单仓库（如 `img18`）或范围随机（见下方） |
| `branch` | string | 否 | 分支，默认 `main` |
| `pathPrefix` | string | 否 | 仓库内路径前缀，如 `2026/02/03`。默认按当前日期自动生成 |
| `token` | string | 否 | GitHub Token，用于调用 GitHub API（上传等）。仅保存在本机 |

**repo 范围语法**（随机选一个仓库）：

- `name[min,max]` 或 `name[min-max]`，如 `img[0,20]` 或 `img[0-20]`
- 表示从 `name`+min 到 `name`+max 的仓库列表，每次随机取一个（如 img0～img20）
- 解析规则：正则 `^(.+)\[(\d+)[,\-](\d+)\]$`，min>max 时交换

---

## CDN URL 规则

- **格式**：`https://fastly.jsdelivr.net/gh/{owner}/{repo}@{branch}/{path}`
- **path**：由 `pathPrefix` + 文件名（或子路径）拼接，如 `pathPrefix` 为 `2026/02/03`、文件为 `xxx.jpg` 时，path 为 `2026/02/03/xxx.jpg`
- **repo**：若为范围语法，生成 URL 时先解析为具体仓库名（如 img7），再拼进 URL，保证 URL 中为单一 repo 名

需提供两种 URL 生成方式：

1. **按当前配置随机 repo**：`getJsdelivrUrl(path)`，path 可为相对文件名或带 pathPrefix 的路径。
2. **指定 repo 名**：`getJsdelivrUrlForRepo(repoName, path)`，path 为仓库内完整路径（用于上传后根据 API 返回的 path 拼 CDN 链接）。

---

## 持久化与默认值

- **localStorage**：以单一 key 保存完整配置 JSON（如 `wx-mp-face-github-repo`）。读时与默认配置合并，缺省 `pathPrefix` 用当前日期。
- **pathPrefix 默认**：当前日期 `YYYY/MM/DD`（如 `getCurrentDatePath()`），并提供「设为当前日期」一键填充。
- **远程默认**：若 localStorage 中**不存在**已保存配置，则请求远程 JSON（如某固定 URL），解析后调用与「导入配置」相同的逻辑写入当前配置（不覆盖已有本地配置）。

---

## GitHub API 使用

- **上传文件**：`PUT https://api.github.com/repos/{owner}/{repo}/contents/{path}`
  - Headers：`Authorization: Bearer {token}`，`Accept: application/vnd.github+json`，`Content-Type: application/json`
  - Body：`{ message, content: base64String, branch }`
  - 成功响应中的 `content.path` 作为仓库内路径，用于拼 jsDelivr URL
- **repo**：若配置为范围语法，上传时用 `resolveRepo(repoStr)` 得到当次使用的具体 repo 名。
- 需将 File 转为 base64（如 `FileReader.readAsDataURL` 后取 base64 段）。

---

## 导出与导入

- **导出**：将当前配置（owner、repo、branch、pathPrefix、token）序列化为 JSON，触发下载，文件名可带时间戳（如 `github-config-{timestamp}.json`）。
- **导入**：用户选择本地 JSON 文件，解析后校验为对象，再写入各配置项（字符串 trim，branch 默认 `main`）；解析失败时展示错误文案（如「导入失败，请检查 JSON 格式」）。

---

## UI 行为与文案

- 标题：**第一步：设置 GitHub 仓库配置**
- 说明：配置后可用 `https://fastly.jsdelivr.net/gh/owner/repo@branch/路径` 格式展示图片
- 表单项：
  - owner、repo、branch、pathPrefix、token（token 用 password 输入框）
  - pathPrefix 旁提供「设为当前日期」按钮
  - repo 下方提示：支持 `img[0,20]` 或 `img[0-20]` 表示 img0～img20 随机选一个
  - token 下方提示：仅保存在本机 localStorage，用于调用 GitHub API 等
- 操作按钮：「导出配置」「导入配置」；导入错误时在旁显示红色错误信息
- 可选：「添加远程图片」— 基于已上传的本地图片文件名，用 pathPrefix + 文件名拼 path，先调用上传接口再得到 CDN URL 并加入列表；需配置 Token；支持按文件名展示按钮列表并显示上传中/错误状态
- 示例 URL：在 owner、repo 有值时，展示一条示例 jsDelivr URL（如 path 示例 `2026/02/03/xxx.jpg`）

---

## 与其它步骤的衔接

- **第二步（上传图片）**：上传时使用当前配置的 owner、repo、branch、pathPrefix、token；path 为 pathPrefix + 随机生成的文件名；上传成功后用 API 返回的 `content.path` 与实际上传的 repo 调用 `getJsdelivrUrlForRepo(repo, contentPath)` 得到 CDN URL 并加入展示列表。
- **预览/复制**：预览与「渲染后样式复制」使用的图片 URL 均来自上述 CDN URL 或本地 blob，无需在配置模块内重复实现。

---

## 实现要点小结

1. **配置**：owner、repo、branch、pathPrefix、token；localStorage 持久化；无本地配置时拉取远程默认 JSON。
2. **repo 解析**：支持 `name[min,max]` / `name[min-max]`，随机取一个具体 repo 名用于 API 与 URL。
3. **URL**：`getJsdelivrUrl(path)`（随机 repo）、`getJsdelivrUrlForRepo(repoName, path)`（指定 repo，path 为仓库内完整路径）。
4. **上传**：GitHub Contents API PUT，base64 内容；返回的 `content.path` 用于拼 CDN 链接。
5. **pathPrefix**：默认当前日期；可编辑；提供「设为当前日期」。
6. **导出/导入**：JSON 文件下载与上传；导入失败有错误提示。
7. **Token**：仅前端保存与使用，不提交到非 GitHub 的服务器；上传、远程默认拉取等依赖 Token 时再校验。

按以上提示词可实现或复现「第一步：设置 GitHub 仓库配置」的完整行为与交互。
