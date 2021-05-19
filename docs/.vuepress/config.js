const autometa_options = {
  site: {
    name: '前端develop'
  },
  canonical_base: 'https://www.fedevelop.cn',
};

module.exports = {
  GAID: 'UA-150400513-1',
  title: '前端develop',
  description: '技术分享，Not only front-end!',
  dest: 'public',
  head: [
    ['meta', { name: 'keywords', content: '前端develop,博客分享,前端技术,Vue.js,JavaScript,HTML,H5,副业' }],
    ['meta', { name: 'baidu_union_verify', content: 'd9618350592112eff127ae228cba0df0' }],
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'viewport', content: 'width=device-width,initial-scale=1,user-scalable=no' }],
    ['link', { rel: 'icon', href: '/imgs/logo.png' }],
    ['link', { rel: 'manifest', href: '/manifest.json' }],
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }],
    ['link', { rel: 'apple-touch-icon', href: '/imgs/logo.png' }],
    ['link', { rel: 'mask-icon', href: '/icons/safari-pinned-tab.svg', color: '#3eaf7c' }],
    ['meta', { name: 'msapplication-TileColor', content: '#000000' }],
    ['script', { type: 'text/javascript', src: '/js/push.js' }],
    ['script', { charset: 'utf-8', src: 'https://hm.baidu.com/hm.js?c03dc728c7c7aea53311f86758b041c7' }],
    ['script', { charset: 'utf-8', src: 'https://readmore.openwrite.cn/js/readmore.js' }],
    // 添加百度联盟广告的js
    ['script', { defer: 'defer', async: 'async', src: '//cpro.baidustatic.com/cpro/ui/cm.js' }]
  ],
  theme: 'reco',
  themeConfig: {
    nav: [
      { text: '首页', link: '/', icon: 'reco-home' },
      { text: '关于我', link: '/views/about', icon: 'reco-other' },
      { text: '时间轴', link: '/timeline/', icon: 'reco-date' },
      {
        text: '联系我',
        icon: 'reco-message',
        items: [
          { text: 'GitHub', link: 'https://github.com/AD-feiben', icon: 'reco-github' },
          { text: '掘金', link: 'https://juejin.im/user/58d3ab5b128fe1006cb236e1', icon: 'reco-juejin' },
          { text: '知乎', link: 'https://www.zhihu.com/people/fei-ben-3-68/activities', icon: 'reco-zhihu' },
          { text: '简书', link: 'https://www.jianshu.com/u/ccb05861b473', icon: 'reco-jianshu' }
        ]
      }
    ],
    type: 'blog',
    blogConfig: {
      category: {
        location: 2,
        text: '分类'
      },
      tag: {
        location: 3,
        text: '标签'
      }
    },
    logo: '/head.png',
    search: true,
    searchMaxSuggestions: 10,
    sidebar: 'auto',

    lastUpdated: '更新于:',
    author: '前端develop',
    authorAvatar: '/head.png',
    record: '粤ICP备19159721号-1',
    recordLink: 'http://www.beian.miit.gov.cn',
    startYear: '2017',
    valineConfig: {
      appId: 'jSVTklp4k0iME4GqIF4wiLvR-MdYXbMMI',
      appKey: 'PmGnm2o6TNtNgRETcB9FUkDb',
      placeholder: 'Type something here...',
      recordIP: true,
      visitor: true,
      notify: true, // 邮件提醒!!!
      verify: true // 验证码
    },

    themePicker: false
  },
  markdown: {
    lineNumbers: true
  },
  plugins: {
    '@vuepress/pwa': {
      serviceWorker: true,
      updatePopup: true
    },
    '@vuepress/active-header-links': {},
    flowchart: {},
    sitemap: {
      hostname: 'https://www.fedevelop.cn/'
    },
    robots: {
      host: "https://www.fedevelop.cn/",
      allowAll: true,
      sitemap: "/sitemap.xml"
    },
    autometa: autometa_options
  }
};
