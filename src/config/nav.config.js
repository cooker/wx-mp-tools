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
        { name: 'IDEA 激活', url: 'https://hapgpt.com/archives/1752542998485', desc: 'IDEA 永久激活', icon: '📝' },
        { name: '视频下载', url: 'https://pan.quark.cn/s/9532d26de8eb', desc: '视频下载', icon: '🎬' },
      ],
    },
    {
      id: 'design',
      name: '公众号',
      icon: '🎨',
      items: [
        { name: 'Wechat-MP', url: 'https:/hapgpt.com/mp', desc: '公众号图片排版', icon: '🐙' },
        { name: 'Wechat文章', url: 'https:/hapgpt.com/mp1', desc: '公众号文字排版', icon: '💬' },
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
