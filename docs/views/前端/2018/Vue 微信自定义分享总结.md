---
title: Vue 微信自定义分享总结
date: 2018-06-22
categories:
 - 前端
tags:
 - Vue
 - 微信
---

因为之前一直使用的是 hash 模式，所以配置微信分享比较简单，不管是 Android 还是 iOS，只需要获取一次签名即可，然后在需要配置分享的页面在 wx.ready 的回调中编写分享的逻辑即可。

原来一直用 hash 模式都没什么问题，可能是最近微信升级之后，在 Android 端微信授权后重定向回来页面并不会刷新，导致我无法获取用户的授权信息。尝试了很久之后将路由改成 history 模式就解决了。但是 history 模式也有很多棘手的问题，分享就是其中一个。

在网上查阅了大量文章，但大多都是点到为止。说明了 Android 和 iOS 获取签名失败的问题。简单的说就是，在 iOS 的机器中，获取签名只需要去第一次进入的地址，在 Android 的机器中，每次路由跳转都需要拿当前地址去授权。 具体可以参考[微信分享 总结（SPA/history模式）](https://github.com/yongheng2016/blog/issues/78)

我的做法是在打开页面的时候就去获取签名，然后进入需要分享的页面时，再判断是或否在 Android 设备中，再决定是否需要获取新的签名。签名的问题解决之后，我以为就OK了，后面才发现在 iOS 分享还是有问题。最后定位到的问题是在 iOS 中不会在进入分享页之后重复触发 wx.ready 的方法，只需要编写分享的逻辑即可。

```javascript
function getSignature () {
  // 获取微信签名
}

function wxShare (data) {
  if (/(Android)/i.test(window.navigator.userAgent)) {
    // 在 Android 设备，需要获取新的签名
    getSignature()
  }

  wx.ready (function () {
    shareConfig(data)
  })

  // iOS 设备不会多次触发 wx.ready
  shareConfig(data)
}

function shareConfig (data) {
  // 分享逻辑
}
```

---

如果你喜欢我的文章，希望可以关注一下我的公众号【前端develop】

![前端develop](/imgs/qrcode.png)