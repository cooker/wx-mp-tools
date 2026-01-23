/**
 * 工具导航 - 快速配置
 * 修改此文件即可更新站点内容，无需改组件代码。
 *
 * 配置说明：
 * - site: 站点标题、描述等
 * - categories: 分类列表，每个分类包含 name、icon(可选)、items
 * - items: 链接列表，每项包含 name、url、desc(可选)、icon(可选)
 */

export const navConfig = {
  site: {
    title: '工具导航',
    description: '常用开发与效率工具集合，一键直达',
  },

  categories: [
    {
      id: 'dev',
      name: '开发工具',
      icon: '⚙️',
      items: [
        { name: 'Wechat-MP', url: 'https://6d750607.pinit.eth.limo', desc: '公众号排版', icon: '🐙' },
        { name: 'IDEA 激活', url: 'https://hapgpt.com/archives/1752542998485', desc: 'IDEA 永久激活', icon: '📝' },
        { name: 'Stack Overflow', url: 'https://stackoverflow.com', desc: '技术问答社区', icon: '💬' },
        { name: 'MDN', url: 'https://developer.mozilla.org', desc: 'Web 技术文档', icon: '📚' },
      ],
    },
    {
      id: 'design',
      name: '设计资源',
      icon: '🎨',
      items: [
        { name: 'Figma', url: 'https://figma.com', desc: '协作式设计工具', icon: '🖌️' },
        { name: 'Unsplash', url: 'https://unsplash.com', desc: '免费高质量图片', icon: '📷' },
        { name: 'Coolors', url: 'https://coolors.co', desc: '配色方案生成', icon: '🌈' },
      ],
    },
    {
      id: 'utils',
      name: '实用工具',
      icon: '🔧',
      items: [
        { name: 'TinyPNG', url: 'https://tinypng.com', desc: '图片压缩', icon: '🖼️' },
        { name: 'Can I Use', url: 'https://caniuse.com', desc: '前端兼容性查询', icon: '✅' },
        { name: 'Regex101', url: 'https://regex101.com', desc: '正则测试与解释', icon: '📐' },
      ],
    },
  ],
}
