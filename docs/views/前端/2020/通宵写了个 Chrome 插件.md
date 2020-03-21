---
title: 通宵写了个 Chrome 插件
date: 2020-3-21
categories:
 - 插件
tags:
 - 插件开发
---

## 起因

昨天在掘金看到一篇关于浏览器插件的教程，看完之后觉得还挺简单的，于是就在想有什么需求可以做成插件。

之前用 Python 写了一个发布头条文章的小工具，因为每发一篇文章就需要 Python 打开浏览器，设置 cookie 等相对耗时的操作，于是决定将这个工具改写为浏览器插件。

<!-- more -->

插件效果图如下：

![plugin-toutiao](https://github.com/AD-feiben/plugin-toutiao/raw/master/img/effect.png)

插件源码：https://github.com/AD-feiben/plugin-toutiao

## 浏览器插件的要点

写一个浏览器插件主要由 `manifest.json`、`popup.html`、`content.js`、`background.js` 组成。

具体教程大家可参考网络上其他文章，这里就大概讲一下。

- `manifest.json` 为配置清单文件，可以设置插件名称，插件版本，各个页面内。

```js
{
  // 清单文件的版本，这个必须写，而且必须是2
  "manifest_version": 2,
  // 插件名称
  "name": "头条搞笑GIF",
  // 插件版本号
  "version": "1.0.0",
  // 插件描述
  "description": "api获取搞笑gif，并发布头条",
  // 插件图标，在浏览器扩展程序管理页面显示
  "icons": {
    "16": "static/img/icon.png",
    "48": "static/img/icon.png",
    "128": "static/img/icon.png"
  },

  // 后台运行的页面
  "background": {
    // 2种指定方式，如果指定JS，那么会自动生成一个背景页
    // "page": "template/background.html"
    "scripts": ["static/js/background.js"]
  },

  // 指定 popup 页面
  "browser_action": {
    "default_icon": "static/img/icon.png",
    "default_title": "头条搞笑GIF",
    "default_popup": "template/popup.html"
  },

  "content_scripts": [{
    // 匹配所有 url
    "matches": ["<all_urls>"],
    // 在页面中按顺序注入以下脚本
    "js": ["static/js/content.js"],
    // 在页面注入的样式
    "css": ["static/css/content.css"],
    // 代码注入的时间，可选值： document_start, document_end, or document_idle，最后一个表示页面空闲时，默认document_idle
    "run_at": "document_idle"
  }]
}
```

- `popup.html` 为插件的弹窗，当然也可以执行 js 脚本。

- `content.js` 则会将脚本注入到每个页面内。

- `background.js` 则是插件后台运行的脚本。

## 插件通信

- `popup` 与 `background` 通信。`popup` 和 `background` 在同一上下文，可以直接调用。

```js
// background.js
var views = chrome.extension.getViews({type:'popup'}); // 返回popup对象
if(views.length > 0) {
    console.log(views[0].location.href);
}
function test(){
	console.log('我是background')；
}

// popup.js
var bg = chrome.extension.getBackgroundPage();
bg.test(); // 访问background的函数
console.log(bg.document.body.innerHTML); // 访问background的DOM
```

- `content` 与插件通信

`popup` 和 `background` 收发消息

```js
// 发消息
function sendMsgToContentScript(message, callback){
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    chrome.tabs.sendMessage(tabs[0].id, message, function(response){
      if(callback) callback(response);
    })
  })
}

// 收消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResonse){
  if(request.type === 'contentMsg'){
    console.log('收到来自content的消息：' + request.value);
  }
  sendResonse('我是后台，已收到你的消息。');
})
```

`content` 收发消息

```js
// 发消息
chrome.runtime.sendMessage({type: 'contentMsg', value: '你好，我是content'},function(response){
  console.log('收到来自后台的回复：'+ response)；
})

// 收消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  if(request.type === 'popMsg'){
    console.log('收到来自popup的消息：' + request.value);
  }
  sendResponse('我是content,已收到你的消息');
})
```


- `popup` 只有打开插件弹窗时才可以与其他脚本通信。


## 需求分析

1、首先在 `popup` 填写参数，点击发布文章按钮时需要获取文章数据并打开头条编辑文章的页面，在打开页面后将数据从 `popup` 发送给`content`。

因为点击按钮会打开一个新页面，导致 `popup` 会自动关闭，使得数据无法从 `popup` 传递给 `content`。为了解决这个问题，昨晚干了一个通宵。

后来改了思路，再点击发布文章时，将参数先传递给 `background` 并开始获取数据，然后再打开一个新页面。等页面打开之后再与 `background` 通信获取刚刚的数据。

为了区分从插件点击打开的页面，与用户在其他地方打开的页面，在 `popup` 传递参数给 `background` 时设置一个标记，说明该页面是从插件打开的，等 `content` 获取数据时，将标记清空。

2、`content` 获取到数据后进行解析，将内容填入编辑器内。

## 总结

插件开发主要需要区分插件与页面的上下文。

另外需要注意 `popup` 只有在打开弹窗时才可以进行通信，必要时可以通过 `background` 中转。

这篇文章不是开发教程，更多的是开发思路。如需教程，可以学习参考文章。

希望这篇文章能给各位小伙伴帮助。

## 参考

[从零开始写一个采集图片的chrome插件](https://juejin.im/post/5e745f35e51d4526c80ec11c?utm_source=gold_browser_extension#heading-8)


---

如果还有其他疑问，欢迎大家扫码关注我的公众号【前端develop】给我留言。

![前端develop](/imgs/qrcode.png)
