/**
 * 提示词板块 - 独立配置
 * 修改此文件或 public/prompt/*.md 即可维护提示词。
 *
 * 配置说明：
 * - enabled: 是否展示提示词板块
 * - title: 板块标题
 * - autoLoadFromPublic: 为 true 时，自动加载 public/prompt/*.md（需构建时生成 manifest）
 * - items: 提示词列表
 *   - id: 唯一标识，用于 file 匹配或作为 public/prompt/{id}.md 文件名
 *   - title: 提示词名称
 *   - tags: 分类标签，支持多标签，如 ['代码', '测试']
 *   - content: 内联内容（当无 url 且无 file 时使用）
 *   - url: 可选，远程地址，有值时从该 URL 拉取内容（覆盖 content）
 *   - file: 可选，如 'code-review'，从 public/prompt/code-review.md 加载
 *
 * 数据优先级：url > file（本地 .md）> content
 */

export const promptConfig = {
  enabled: true,
  title: '开发提示词',
  /** 是否自动加载 public/prompt 目录下的 .md 文件（需配合构建生成 manifest） */
  autoLoadFromPublic: true,

  items: [
    // {
    //   id: 'code-review',
    //   title: '代码审查',
    //   tags: ['代码'],
    //   content: '请作为资深开发者，审查以下代码，指出潜在 bug、性能问题、可读性改进建议，并给出更优实现（如有）。',
    //   // url: 'https://example.com/prompts/code-review.md',  // 可选：从远程拉取
    //   // file: 'code-review',  // 可选：从 /prompt/code-review.md 加载，省略时用 id
    // },
    // {
    //   id: 'code-explain',
    //   title: '代码解释',
    //   tags: ['代码'],
    //   content: '请逐行解释以下代码的逻辑与作用，对关键概念用简短示例说明。',
    // },
    // {
    //   id: 'unit-test',
    //   title: '生成单测',
    //   tags: ['测试', '代码'],
    //   content: '请为以下函数/模块编写单元测试，覆盖正常与边界情况，使用项目已有的测试框架与风格。',
    // },
  ],
}
