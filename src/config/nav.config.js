/**
 * 工具导航 - 快速配置
 * 修改此文件即可更新站点内容，无需改组件代码。
 *
 * 配置说明：
 * - site: 站点标题、描述等
 * - categories: 分类列表，每个分类包含 name、icon(可选)、items
 * - items: 链接列表，每项包含 name、url、desc(可选)、icon(可选)
 * - ad: 底部广告位，可选 image / html / link 三种方式
 * - notices: 右侧公告列表，支持点击跳转
 * - rewardCode: 赞赏码（微信/支付宝收款码图片）
 * - groupCode: 群码（加入群聊的二维码图片）
 */

export const navConfig = {
  site: {
    title: '工具导航',
    description: '常用开发与效率工具集合，一键直达',
  },

  /** 右侧公告：notices.enabled 为 true 时展示 */
  notices: {
    enabled: true,
    title: '公告',
    items: [
      {
        title: '微信搜索公众号: 聚好推助手',
        content: '输入邀请码 MW4IYS 注册',
        url: '',
        date: '2024-01-10',
      },
    ],
  },

  /** 赞赏码：公告下方展示，enabled 为 true 且 src 有值时显示 */
  rewardCode: {
    enabled: true,
    title: '赞赏',
    src: 'https://fastly.jsdelivr.net/gh/gulugulu-lab/img14@main/2026/02/03/1770301826151-1f0a5590-7a92-4c8b-b6ca-54eb7338450d.png',
    desc: '请作者喝杯咖啡',
  },

  /** 群码：公告下方展示，enabled 为 true 且 src 有值时显示 */
  groupCode: {
    enabled: true,
    title: '交流群',
    src: 'https://fastly.jsdelivr.net/gh/gulugulu-lab/img19@main/2026/02/03/1770301133890-a8591e06-6389-4f72-b0b8-4294253e334a.png',
    desc: '扫码加入交流群',
  },

  /** 底部广告位：ad.enabled 为 true 时展示，按优先级使用 html > image > link */
  ad: {
    enabled: true,
    // 方式一：自定义 HTML（如 AdSense、联盟脚本等）
    // html: '<div class="ad-unit">...</div>',
    // 方式二：图片广告
    image: {
      src: 'https://fastly.jsdelivr.net/gh/bucketio/img14@main/2026/01/27/1769477339654-79fbee3a-ebf3-436a-8981-1c94099ca3fb.jpg',
      url: 'https://www.aliyun.com/minisite/goods?userCode=md7pdz8m',
      alt: '阿里云推广',
    },
    // 方式三：文案链接（当 image、html 都未配置时使用）
    // link: { text: '赞助商链接', url: 'https://example.com' },
  },

  categories: [
    {
      id: 'dev',
      name: '开发工具',
      icon: '⚙️',
      size: 'md', // sm | md | lg (bento span)
      items: [
        { name: 'IDEA 激活', url: 'https://hapgpt.com/archives/1752542998485', desc: 'IDEA 永久激活', icon: '📝' },
        { name: '视频下载', url: 'https://pan.quark.cn/s/9532d26de8eb', desc: '视频下载', icon: '🎬' },
        { name: '炒股', url: 'https://chengzuopeng.github.io/stock-dashboard/eod-picker', desc: '炒股', icon: '🌊' },
        { name: '🎅 ', url: 'http://x67.top/sdm1/#1769562997258', desc: '圣诞帽生成器', icon: '🎅 ' },
        { name: 'GitHub加速 🇺🇸', url: 'https://play.ruanyazyk.com/github.html', desc: 'GitHub加速', icon: '🇺🇸' },
      ],
    },
    {
      id: 'design',
      name: '公众号',
      icon: '🎨',
      size: 'md',
      items: [
        { name: 'Wechat-MP', url: 'https://cooker.github.io/wx-mp-article', desc: '公众号图片排版', icon: '🐙' },
        { name: 'Wechat文章', url: 'https://cooker.github.io/wx-mp-blank', desc: '公众号文字排版', icon: '💬' },
        { name: '废话生成器', url: 'http://cooker.github.io/wx-mp-dog', desc: '废话生成器', icon: '💬' },
        { name: '九宫格人像', url: 'http://cooker.github.io/wx-mp-face', desc: '九宫格人像', icon: '👤' },
      ],
    },
    {
      id: 'utils',
      name: '实用工具',
      icon: '🔧',
      size: 'lg',
      items: [
        { name: 'TinyPNG', url: 'https://tinypng.com', desc: '图片压缩', icon: '🖼️' },
        { name: 'WifiCard', url: 'https://wificard.io/', desc: 'Wifi链接卡', icon: '🌐' },
        { name: 'Zlib', url: 'https://getzlib.com/zh', desc: '电子书', icon: '🔧' },
        { name: '磁力搜索', url: 'https://knaben.org/search', desc: '磁力搜索', icon: '🔍' },
        { name: '相册服务', url: 'https://immich.app/', desc: '相册服务', icon: '📷' },
        { name: '中文播客榜', url: 'https://xyzrank.com', desc: '中文播客榜', icon: '🎵' },
        { name: 'windows自动登录', url: 'https://learn.microsoft.com/en-us/sysinternals/downloads/autologon', desc: 'windows自动登录', icon: '💻' },
      ],
    },
  ],
}
