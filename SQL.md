# SQL 模板功能（给 AI / 协作者）

你是本仓库的开发者。请**只改与需求相关的文件**，保持现有风格与约定。

## 项目是什么

Vue 3 + Vite 静态站点：从 `public/sql-templates/*.md` 读取业务 SQL 模板，路由 `#/sql`，左侧列表 + 右侧 Tab（DDL / SEED / QUERY / UPDATE / REPORT / DEV）；编辑器为 **CodeMirror**（`@codemirror/lang-sql`），**sql-formatter** 格式化。

## 本地运行

- `pnpm install`
- `pnpm dev`（`predev` 会跑提示词与 SQL 的 manifest 生成脚本）
- 勿用 `file://` 打开构建产物以外的裸文件测试 `fetch`（开发时用 Vite 即可）

## 目录与清单（manifest）

- 模板文件：`public/sql-templates/*.md`（排除 `README.md`）
- **`manifest.json` 由脚本自动生成，不要手工编辑、也不要手工维护路径列表。**
- 生成脚本：`scripts/generate-sql-manifest.js`
- 触发时机：`pnpm dev` / `pnpm build` 前的 `predev` / `prebuild` 会自动执行；若在**已启动的 dev** 下新增 `.md`，可执行 `pnpm run sync:sql-templates` 再刷新页面。

## 新增 / 修改模板（MD）

1. 将 `.md` 放在 `public/sql-templates/`（当前清单为**单层**，文件名即模板 id，如 `order-example.md` → id `order-example`）
2. 顶部 **YAML front matter** 必填：`code`、`name`、`bizType`、`version`、`description`
3. 分节标题：`## DDL` / `SEED` / `QUERY` / `UPDATE` / `REPORT` / `DEV`（按需）
4. 每个小节内：`### 标题` + 可选 `> NOTE:` + 单个 ` ```sql ` 代码块
5. 保存后跑 `pnpm run sync:sql-templates` 或重新 `pnpm dev` / `pnpm build`，以更新 `manifest.json`

## 修改前端时注意

- 模板加载使用 `fetch` + `cache: 'no-store'` 与时间戳；除非明确要求，不要随意去掉防缓存逻辑。

## 数据库 DDL 约定（若用户未另说明）

- 表选项可写 `ENGINE=InnoDB`，**不要**在模板里写 `CHARSET` / 字符集相关子句（与现有 TOC 模板一致）

## 交付前自检

- `pnpm run build` 无报错
- 浏览器中 SQL 模板列表与 Tab 内容正常、控制台无红错
