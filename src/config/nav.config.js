/**
 * 工具导航 - 快速配置
 * 修改此文件即可更新站点内容，无需改组件代码。
 *
 * 配置说明：
 * - site: 站点标题、描述等
 * - categories: 分类列表，每个分类包含 name、icon(可选)、items
 * - items: 链接列表，每项包含 name、url、desc(可选)、icon(可选)、internal(可选，站内链接)
 * - ad: 底部广告位，支持多个广告轮播，每项可选 image / html / link
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

  /**
   * 底部广告位：ad.enabled 为 true 时展示，支持多广告轮播
   * 图片展示：宽 100%、高 120px，平铺拉伸填充（object-fit: fill）
   * 推荐尺寸：1200×120（约 10:1）或 1200×80（15:1），横版长图适配更好
   */
  ad: {
    enabled: true,
    /** 轮播间隔（ms），默认 5000 */
    interval: 5000,
    /** 广告列表，每项按优先级使用 html > image > link */
    items: [
      {
        image: {
          src: 'https://fastly.jsdelivr.net/gh/bucketio/img14@main/2026/01/27/1769477339654-79fbee3a-ebf3-436a-8981-1c94099ca3fb.jpg',
          url: 'https://www.aliyun.com/minisite/goods?userCode=md7pdz8m',
          alt: '阿里云推广',
        },
      },
      {
        image: {
          src: 'https://cdn.jsdelivr.net/gh/gulugulu-lab/img0@main/2026/02/06/qUXEih.jpg',
          url: 'https://www.adobe.com/cn/',
          alt: 'Adobe 全家桶',
        },
      }
      // { link: { text: '赞助商链接', url: 'https://example.com' } },
    ],
  },

  categories: [
    {
      id: 'dev',
      name: '开发工具',
      icon: '⚙️',
      size: 'md', // sm | md | lg (bento span)
      items: [
        { name: '开发提示词', url: '/prompts', desc: 'AI 提示词库，一键复制', icon: '💬', internal: true },
        { name: 'IDEA 激活', url: 'https://hapgpt.com/archives/1752542998485', desc: 'IDEA 永久激活', icon: '📝' },
        { name: '视频下载', url: 'https://pan.quark.cn/s/9532d26de8eb', desc: '视频下载', icon: '🎬' },
        { name: '炒股', url: 'https://chengzuopeng.github.io/stock-dashboard/eod-picker', desc: '炒股', icon: '🌊' },
        { name: '🎅 ', url: 'http://x67.top/sdm1/#1769562997258', desc: '圣诞帽生成器', icon: '🎅 ' },
        { name: 'GitHub加速 🇺🇸', url: 'https://play.ruanyazyk.com/github.html', desc: 'GitHub加速', icon: '🇺🇸' },
        { name: 'Windows 启动盘', url: 'https://rufus.ie/zh/', desc: '启动盘制作', icon: '💻' },
        { name: '个人播客', url: 'https://tianji.dev/', desc: '网站监控', icon: '🌍' },
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
        { name: '闪图', url: 'https://x.xiaochungu.xyz', desc: '3秒销毁', icon: '🖼️' },
        { name: '公众号图片导出', url: 'https://g.xiaochungu.xyz', desc: '公众号图片导出', icon: '🖼️' },
        { name: '精美封面图', url: 'https://imgx.zzao.club/', desc: '选择一个模板，一行代码生成精美封面图', icon: '📷' },
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
        { name: '天气时钟', url: 'https://teojs.github.io/clock-dashboard/', desc: '天气时钟', icon: '🌤️' },
        { name: 'windows自动登录', url: 'https://learn.microsoft.com/en-us/sysinternals/downloads/autologon', desc: 'windows自动登录', icon: '💻' },
        { name: 'AI 设计稿', url: 'https://www.mockdown.design/', desc: 'markdown 设计稿', icon: '🎵' },
      ],
    },
  ],
}
