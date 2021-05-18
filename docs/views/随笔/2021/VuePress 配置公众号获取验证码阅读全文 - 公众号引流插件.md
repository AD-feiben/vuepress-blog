---
title: 如何用 OpenWrite 给 VuePress 配置博客导流公众号插件 - 公众号获取验证码阅读全文
date: 2021-5-18
categories:
 - VuePress
tags:
 - 公众号
 - VuePress
 - 引流
 - OpenWrite
---

经常在网络上浏览文章的小伙伴可能会遇到一些这样的文章，当我们看的正起劲的时候，剩余的内容都被隐藏了，需要到指定公众号回复关键词解锁。

这两天我也给我的博客加上了，因为踩了一些坑，所以记录一下，希望能帮助到更多人。接下来一起来看看是如何配置的吧。

<!-- more -->

## OpenWrite

> [OpenWrite](https://openwrite.cn/) 是一个群发软件、博客导流公众号-阅读全文工具、媒体发布平台、博客群发平台、软文推广平台、软文推广发布、博客发布官网引流科技小工具、微信公众号Markdown编辑器、多平台免费图床配置、Markdown 编辑器的免费简洁流畅、文章一键群发等的免费自媒体运营工具助手。

这里我们借助 OpenWrite 提供的 [博客导流公众号](https://readmore.openwrite.cn/user/blog2weixin/add)

填好如下表单，即可生成生成你的 blogId

![](https://feiben-1253434158.cos.ap-guangzhou.myqcloud.com/PicGo/form.png)

返回 [博客列表](https://readmore.openwrite.cn/user/blog2weixin/list) 查看刚刚生成的 blogId。接下里既可以开始进行配置。

## 公众号配置

登录[公众号后台](https://mp.weixin.qq.com/) 配置关键词自动回复即可

![](https://feiben-1253434158.cos.ap-guangzhou.myqcloud.com/PicGo/mp.weixin.qq.com_advanced_autoreply_action=smartreply&t=ivr_keywords&token=288086371&lang=zh_CN.png)

自动回复内容如下

```html
<a href="https://readmore.openwrite.cn/code/generate?blogId=yourBlogId">点击该链接，获取博客解锁验证码</a>
```


## VuePress 配置

OpenWrite 的教程描述如下

![](https://feiben-1253434158.cos.ap-guangzhou.myqcloud.com/PicGo/openwrite.png)

1. 添加 https://readmore.openwrite.cn/js/readmore.js

这个还比较好处理，在 `docs/.vuepress/config.js` 的 `head` 添加多一条数据即可

```js
// docs/.vuepress/config.js
head: [
  ...,
  ['script', { charset: 'utf-8', src: 'https://readmore.openwrite.cn/js/readmore.js' }]
]
```

2. 添加脚本

主要是在这一步踩了一些坑。希望看完我的解决方法后能够帮助到你。


- `init` 方法中的 `id`

此 id 必须为容器的 id，而 VuePress 的内容容器并没有 id 的属性。那么只能通过 js 添加 id，代码如下

```js
const container = document.querySelector('.theme-reco-content.content__default');
container.setAttribute('id', 'container');
```

- 加载 js

一开始我也在 `docs/.vuepress/config.js` 的 `head` 中导入这么一个 js，结果报错了，提示找不到容器。

因为在 `head` 中的 js 会在页面内容生成之前就执行了，为了解决这个问题，我加上了 `window.onload` 事件，然后又报了另外一个错: <span style="color:red">btw is not defined</span>，经过检查发现 `readmore.js` 直接使用全局的 `btw` 对象。

于是我将 `btw` 添加到 `window` 上，这次再看效果，貌似可以了。

```js
window.onload = () => {
  const container = document.querySelector('.theme-reco-content.content__default');
  container.setAttribute('id', 'container');
  window.btw = new BTWPlugin();
  window.btw.init({
    id: 'container',
    blogId: 'xxx',
    name: '前端develop',
    qrcode: 'xxx',
    keyword: '验证码',
  });
}
```

经过测试，发现只有第一次进入页面时有效，因为 VuePress 也是一个单页应用，`onload` 事件只会触发一次，所以这个方法还是行不通。

### 最终方案

最后还是用 Vue 全局的 `Mixin` ，代码如下：

```js
// docs/.vuepress/enhanceApp.js
// 使用异步函数也是可以的
export default ({
  Vue, // VuePress 正在使用的 Vue 构造函数
  options, // 附加到根实例的一些选项
  router, // 当前应用的路由实例
  siteData, // 站点元数据
  isServer, // 当前应用配置是处于 服务端渲染 或 客户端
}) => {
  Vue.mixin({
    // 混合注入,加载全局文件
    mounted() {
      const container = document.querySelector('.theme-reco-content.content__default');
      if (!container) return;
      container.setAttribute('id', 'container');
      window.btw = new BTWPlugin();
      window.btw.init({
        id: 'container',
        blogId: 'xxx',
        name: '前端develop',
        qrcode: 'xxx',
        keyword: '验证码',
      });
    }
  });
};
```

## OpenWrite 工具的优缺点

先说下缺点

1. OpenWrite 隐藏文章内容是通过 CSS 样式实现的，那么稍微懂点前端的同学，就可以直接改 CSS 查看全文。主要样式如下：

```css
position: relative;
height: 350px;
overflow: hidden;
```

2. 公众号关键词回复的内容为 https://readmore.openwrite.cn/code/generate?blogId=yourBlogId，如果用户知道 blogId 那么可以直接打开该链接获取验证码。

3. 目前已有一些浏览器插件可以将关闭 OpenWrite 的隐藏功能。

优点就是免服务器、免开发，这对于我来说已经足矣。


以上就是本文的全部内容，希望能帮助到你，如有疑问，欢迎评论区留言讨论或者可以到我的公众号获取微信联系我。

