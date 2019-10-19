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

  valineConfig: {
    appId: 'jSVTklp4k0iME4GqIF4wiLvR-MdYXbMMI',
    appKey: 'PmGnm2o6TNtNgRETcB9FUkDb',
    recordIP: true
  }
})