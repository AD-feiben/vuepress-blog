/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app and you should
 * disable HTTP caching for this file too.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */

importScripts("https://storage.googleapis.com/workbox-cdn/releases/3.6.3/workbox-sw.js");

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [
  {
    "url": "404.html",
    "revision": "7413d1be6c9c625c643d20a8cd9de6e6"
  },
  {
    "url": "assets/css/0.styles.b0b9e7b2.css",
    "revision": "72d6eaa9012f0bb1928cdf9ca4fef89d"
  },
  {
    "url": "assets/img/home-bg.7b267d7c.jpg",
    "revision": "7b267d7ce30257a197aeeb29f365065b"
  },
  {
    "url": "assets/img/home-head.9e98f9ef.png",
    "revision": "9e98f9efba10bcad33519b782a1d09db"
  },
  {
    "url": "assets/img/icon_vuepress_reco.406370f8.png",
    "revision": "406370f8f120332c7a41611803a290b6"
  },
  {
    "url": "assets/img/search.83621669.svg",
    "revision": "83621669651b9a3d4bf64d1a670ad856"
  },
  {
    "url": "assets/js/1.38ffc481.js",
    "revision": "0feb5e7073efbf2801f04870d6190ca2"
  },
  {
    "url": "assets/js/10.4e4a0c17.js",
    "revision": "35965cdee312681e75f54e187ac63809"
  },
  {
    "url": "assets/js/11.159dc96e.js",
    "revision": "b8445981429a66a0c7d87983bc649f21"
  },
  {
    "url": "assets/js/12.aa6c3650.js",
    "revision": "2206f4db0c96593aa64dbe008ab7a0ee"
  },
  {
    "url": "assets/js/13.ff0cb383.js",
    "revision": "ea0b074f1af0b9ea2e360f963288d40d"
  },
  {
    "url": "assets/js/14.585825fb.js",
    "revision": "eb8243983dbd09ba8fc0c0c6541e131c"
  },
  {
    "url": "assets/js/15.ab833fdd.js",
    "revision": "aee1436db0cba6af6bcd111c2634484c"
  },
  {
    "url": "assets/js/16.f27132af.js",
    "revision": "e015e836ceef33fc224851ac3fa0f371"
  },
  {
    "url": "assets/js/17.a0b2396a.js",
    "revision": "4051e0b854b899054c573b0753f859fc"
  },
  {
    "url": "assets/js/18.ba45ab8d.js",
    "revision": "b847dc15b417c437567f4eb71b38d3b8"
  },
  {
    "url": "assets/js/19.cef0d1e4.js",
    "revision": "7dcb93e4b382a566fd73db966af155a9"
  },
  {
    "url": "assets/js/20.68a95f7b.js",
    "revision": "877cb22f30e86698363a1f7bcf606040"
  },
  {
    "url": "assets/js/21.5643cc26.js",
    "revision": "54c39a7f26824feaeeabdf6327495345"
  },
  {
    "url": "assets/js/22.e9542e48.js",
    "revision": "e1d6343b15f5c501d5ba1f2199f4a2a8"
  },
  {
    "url": "assets/js/23.ae79e158.js",
    "revision": "685984ee3f3c9a284967765277d208bc"
  },
  {
    "url": "assets/js/24.104a6327.js",
    "revision": "d766c664beffaff16066792bfa568adc"
  },
  {
    "url": "assets/js/25.7a21b01a.js",
    "revision": "c5117bdd9838ca668acabd763d2ee89d"
  },
  {
    "url": "assets/js/26.8ca3a5e1.js",
    "revision": "2942cf4d12f3703ac433f48aead68162"
  },
  {
    "url": "assets/js/27.1d749980.js",
    "revision": "d3551ebe6f871f913b851594764f53a2"
  },
  {
    "url": "assets/js/28.2b7156d3.js",
    "revision": "9389ee05a54013eccb801aeee886a0b4"
  },
  {
    "url": "assets/js/3.4b49ef90.js",
    "revision": "88b95978b7ec8d7bde8639210de0a91d"
  },
  {
    "url": "assets/js/4.1c3c4dca.js",
    "revision": "c222c0c755c61f7e1222993a475f8672"
  },
  {
    "url": "assets/js/5.d8bf62dc.js",
    "revision": "1de9ee34e1578b204c6a9a9a80ab1804"
  },
  {
    "url": "assets/js/6.4b5c5d1c.js",
    "revision": "d791c2950aa882af4acd3ea4ed418ba9"
  },
  {
    "url": "assets/js/7.bb242b53.js",
    "revision": "5b9ee4a7cb57abbbeae8c9a8bc85cc03"
  },
  {
    "url": "assets/js/8.190b1e36.js",
    "revision": "452417b1bdbf524beb01414a2a177a09"
  },
  {
    "url": "assets/js/9.ad0f44cb.js",
    "revision": "cd8f36d1ab39f1885e7187bfc9917777"
  },
  {
    "url": "assets/js/app.4cd8a4e5.js",
    "revision": "b18a4ae2cb2beef59ad866a62e6537a0"
  },
  {
    "url": "banner.jpg",
    "revision": "9ead67d16ac77651c6d6777f86a53d95"
  },
  {
    "url": "categories/关于我/index.html",
    "revision": "20b834da514e6d1b07ac6279fa32355f"
  },
  {
    "url": "categories/前端/index.html",
    "revision": "2f94b90513c6dc628d5f00d35b454b3b"
  },
  {
    "url": "categories/随笔/index.html",
    "revision": "264f6a8f25edcfe1b8a52ec5e69926e7"
  },
  {
    "url": "categories/CI/index.html",
    "revision": "4a3c7ac4ac5990ac6183d6fac27f3c2d"
  },
  {
    "url": "categories/Docker/index.html",
    "revision": "391a176b383d00805461326bddbf8733"
  },
  {
    "url": "categories/index.html",
    "revision": "5840d617db60f02ff0b0052a93a4da07"
  },
  {
    "url": "categories/Nginx/index.html",
    "revision": "53408cb8ec46ecf56c65a55586fb4110"
  },
  {
    "url": "categories/Python/index.html",
    "revision": "8ee7a49fcb1c37ad93c4a7623a04c9da"
  },
  {
    "url": "google45349a4c10d0687c.html",
    "revision": "9293295bc173774d5b08ff35a995d5b2"
  },
  {
    "url": "head.png",
    "revision": "df1134f593050b4bd061f90fe2f77283"
  },
  {
    "url": "imgs/工具/0.jpeg",
    "revision": "42c092796ff1551657fe0cac5c73995b"
  },
  {
    "url": "imgs/工具/1.jpeg",
    "revision": "8a3b920bf57481b9eca951e89293d0f5"
  },
  {
    "url": "imgs/前端/0.png",
    "revision": "8ac1b69fb7c68aa28f1c60f2c3db937d"
  },
  {
    "url": "imgs/前端/1.png",
    "revision": "1174c12fb6aa5000ea7fcb3668322700"
  },
  {
    "url": "imgs/前端/2.png",
    "revision": "c1179b2a9ef617d85f20a0330abf9f36"
  },
  {
    "url": "imgs/前端/3.png",
    "revision": "76f9f5af8565d77dc94c34871292ebec"
  },
  {
    "url": "imgs/docker/0.png",
    "revision": "afca5caf4fe17a319a5ce5d5c8747e47"
  },
  {
    "url": "imgs/docker/1.png",
    "revision": "4d0228a7bffc87291431d2ba89642ff1"
  },
  {
    "url": "imgs/docker/2.png",
    "revision": "390adbebf53ff6654251957b4320e8b8"
  },
  {
    "url": "imgs/docker/3.png",
    "revision": "d027d4033c821c5be3c487d021e22d3c"
  },
  {
    "url": "imgs/docker/4.png",
    "revision": "7f67413739811525bfb8471e143d74b9"
  },
  {
    "url": "imgs/docker/5.png",
    "revision": "3288cc01815e3ef7d1e6dea4426ffa4e"
  },
  {
    "url": "imgs/logo.png",
    "revision": "df1134f593050b4bd061f90fe2f77283"
  },
  {
    "url": "imgs/nginx/0.png",
    "revision": "51343adf3af1a6934d803158cb5186c8"
  },
  {
    "url": "imgs/python/0.png",
    "revision": "4a9bbc45824e3546239f22518be0d9d7"
  },
  {
    "url": "imgs/python/1.png",
    "revision": "6216570128981d66bd6452043d8057bb"
  },
  {
    "url": "imgs/python/2.png",
    "revision": "e757198d1cfab2308235e577846f632e"
  },
  {
    "url": "imgs/qrcode.png",
    "revision": "0d6bac58c5d7d07dabbeb0edd8832a38"
  },
  {
    "url": "index.html",
    "revision": "ac860a4ad11d4ff214aca92cc46c8a00"
  },
  {
    "url": "tag/index.html",
    "revision": "2632950c2e82e09f9b9f62692ace4d44"
  },
  {
    "url": "tags/程序员/index.html",
    "revision": "8d8c50fc2ee9443545ef7660e7ff6f85"
  },
  {
    "url": "tags/地图/index.html",
    "revision": "55a0942e8642ac636fe9d0067e65bba8"
  },
  {
    "url": "tags/第二技能/index.html",
    "revision": "78bbc42a0caf0f42905a57c426f95871"
  },
  {
    "url": "tags/关于我/index.html",
    "revision": "8172dedb76215671041600f72f8d33a2"
  },
  {
    "url": "tags/滑块验证码/index.html",
    "revision": "8560f89d34fde454a0cc8c0f467c0618"
  },
  {
    "url": "tags/今日头条/index.html",
    "revision": "c4165607089779e376133cef3b8c7155"
  },
  {
    "url": "tags/面试/index.html",
    "revision": "069a874e4b823d2fb67f5e0cda5d3ff5"
  },
  {
    "url": "tags/培训/index.html",
    "revision": "559d4063587ed3992ac65ffafa98c34e"
  },
  {
    "url": "tags/微信/index.html",
    "revision": "31cece3166791da75571edf5cfb00df3"
  },
  {
    "url": "tags/未来/index.html",
    "revision": "0c8c8d28dd477db6aeb743230fbd5cf9"
  },
  {
    "url": "tags/装饰器/index.html",
    "revision": "3b4e3d3cc7a9d6666357280eb42af5cf"
  },
  {
    "url": "tags/CI/index.html",
    "revision": "8fba01e99e74369fc3efe1b99b864d0c"
  },
  {
    "url": "tags/Docker/index.html",
    "revision": "411c558d54d8bd8891c5bd69cf2e89e1"
  },
  {
    "url": "tags/Dockerfile/index.html",
    "revision": "e92a7c7569b310b856402a7a502bd86f"
  },
  {
    "url": "tags/Nexus/index.html",
    "revision": "458c04ec3c4dfc182994ddbadcf2109a"
  },
  {
    "url": "tags/Nginx/index.html",
    "revision": "8e2c1199f330e8d9e18916fc891af4ff"
  },
  {
    "url": "tags/Nuxt/index.html",
    "revision": "89765b1c29258a0694d0fe29c1d29719"
  },
  {
    "url": "tags/selenium/index.html",
    "revision": "5a011b6e2ea24079cfeec7a19995cf99"
  },
  {
    "url": "tags/Travis/index.html",
    "revision": "e555764bddb990b6d51f129a492b6e85"
  },
  {
    "url": "tags/Vue/index.html",
    "revision": "30d10da3f01cff116412a2032babd51e"
  },
  {
    "url": "timeline/index.html",
    "revision": "7381f2e085e0479a3251b4a1b3a6e852"
  },
  {
    "url": "views/工具/2019/持续集成工具.html",
    "revision": "23ff9089d826b85cd87b2666aca4eb8a"
  },
  {
    "url": "views/前端/2017/腾讯地图实现地图找房功能.html",
    "revision": "187b932dc25117e4da6bdccd2b000673"
  },
  {
    "url": "views/前端/2018/记 Nuxt 开发遇到 OOM.html",
    "revision": "ac5d7671e4090b874ae57fd20208b94e"
  },
  {
    "url": "views/前端/2018/Nuxt 实践.html",
    "revision": "7ee7ac4ae625beee7d71c50aa9d10a05"
  },
  {
    "url": "views/前端/2018/Vue 微信自定义分享总结.html",
    "revision": "329d8caa35cb4777852f845e7b459d23"
  },
  {
    "url": "views/随笔/2019/程序员为什么要培养第二技能.html",
    "revision": "46591e56a7c89fed95ed179a402a4443"
  },
  {
    "url": "views/随笔/2019/对未来的一些思考.html",
    "revision": "c4d264e2be720452eb8ea50fe6f13cab"
  },
  {
    "url": "views/随笔/2019/关于 IT 培训.html",
    "revision": "3919047903baba6640ec7ead089f62ff"
  },
  {
    "url": "views/随笔/2019/我是如何面试别人的.html",
    "revision": "329976a314585f4486015d24e2b96074"
  },
  {
    "url": "views/about.html",
    "revision": "0432364b14f7573cd0658758e57f6d39"
  },
  {
    "url": "views/Docker/2019/初识 Docker.html",
    "revision": "321ef3f01b646b93d17537be306e84e1"
  },
  {
    "url": "views/Docker/2019/使用 Dockerfile 制作镜像.html",
    "revision": "9dc97d52c7734a23a1e056b8abd37ab6"
  },
  {
    "url": "views/Docker/2019/使用 Nexus 创建 Docker 仓库.html",
    "revision": "956c28622e4b15c31b79cd7bb48d987f"
  },
  {
    "url": "views/Docker/2019/Docker 仓库.html",
    "revision": "84ea5d1e03bc949c407d14a58edf1981"
  },
  {
    "url": "views/Nginx/2018/Nginx 配置.html",
    "revision": "c032c0d9d4f6cbc0ab979fbeb4d87fdb"
  },
  {
    "url": "views/Python/2019/装饰器详解.html",
    "revision": "35dd573740650af02c59f7823a9ee5dd"
  },
  {
    "url": "views/Python/2019/Python实现头条自动发文章，赚点广告费.html",
    "revision": "f82a58702778162a995d1d1495641745"
  }
].concat(self.__precacheManifest || []);
workbox.precaching.suppressWarnings();
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});
addEventListener('message', event => {
  const replyPort = event.ports[0]
  const message = event.data
  if (replyPort && message && message.type === 'skip-waiting') {
    event.waitUntil(
      self.skipWaiting().then(
        () => replyPort.postMessage({ error: null }),
        error => replyPort.postMessage({ error })
      )
    )
  }
})
