module.exports = {
  type: 'blog',
  // 博客设置
  blogConfig: {
    category: {
      location: 2, // 在导航栏菜单中所占的位置，默认2
      text: '分类' // 默认 “分类”
    },
    tag: {
      location: 3, // 在导航栏菜单中所占的位置，默认3
      text: '标签' // 默认 “标签”
    }
  },
  logo: '/imgs/logo.png',
  sidebarDepth: 2,
  // 最后更新时间
  lastUpdated: '更新于', // string | boolean
  // 作者
  author: '前端develop',
  // 备案号
  record: '',
  // 项目开始时间
  startYear: '2017'
}