const themeReco = require('./themeReco.js')
const nav = require('../nav/')
const sidebar = require('../sidebar/')

module.exports = Object.assign({}, themeReco, {
  nav,
  sidebar,
  // logo: '/head.png',
  // 搜索设置
  search: true,
  searchMaxSuggestions: 10,
  // 自动形成侧边导航
  sidebar: 'auto',

  author: '前端develop',

  valineConfig: {
    appId: 'jSVTklp4k0iME4GqIF4wiLvR-MdYXbMMI',
    appKey: 'PmGnm2o6TNtNgRETcB9FUkDb',
    placeholder: 'Type something here...',
    recordIP: true,
    visitor: true,
    notify: true, // 邮件提醒!!!
    verify: true, // 验证码
  }
})