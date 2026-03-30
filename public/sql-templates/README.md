# SQL 模板目录

约定见仓库根目录 `SQL.md`。

- 将 `.md` 放在本目录（当前实现为**单层**清单：根下每个业务一个 `xxx.md`，id 为文件名不含 `.md`）。
- **`manifest.json` 勿手改**：由 `scripts/generate-sql-manifest.js` 扫描本目录自动生成；`pnpm dev` / `pnpm build` 前会自动执行。开发中若服务已在跑，可执行 `pnpm run sync:sql-templates` 后刷新页面。

## Front matter（必填）

`code`、`name`、`bizType`、`version`、`description`

## 分节

使用二级标题：`## DDL` / `SEED` / `QUERY` / `UPDATE` / `REPORT` / `DEV`（按需）

小节：`### 标题`，可选 `> NOTE:`，再接单个 ` ```sql ` 代码块。
