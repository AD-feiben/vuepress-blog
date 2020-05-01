---
title: 通过小程序云开发了解Serverless
date: 2020-05-01
categories:
 - 前端
tags:
 - Serverless
 - 小程序
 - 云开发
---

最近这段时间下班回家之后一直在写小程序，导致了最近很长一段时间都没更新文章，刚好利用这次假期，总结一下这段时间的工作。

<!-- more -->

## 为什么要写小程序？

其一，工作了几年了，都没有在实际项目中开发过小程序，为了提升自己的技术面，所有这段时间又捡起了小程序。

其二，小程序出来没多久的时候，其实是有写过一些 demo 来练手的，但是因为当时没有服务器，有服务器的时候又觉得各种配置太过繁琐，导致了我对小程序并不是太在意，也就就只是写了一些样式在本地看看。

最近这段时间 Serverless 的概念很火，于是想利用小程序云开发来了解一下 Serverless。而且用了云开发之后，少去了各种繁琐的配置，例如获取 access token、验签等各种繁琐的操作，最重要的是可以不用花钱买服务器。想到这里就大大提升了开发一个小程序的兴致。


其三、现有的很多小程序都贴满了各种广告，这其实就是开发者的一个盈利模式。假如我的小程序也能够贴广告的话，那也是增加收入的一个方式。

一举三得，那为什么还不开发一个小程序呢？回到重点，关注 Serverless。

## 什么是 Serverless

最近在掘金、朋友圈经常看到 Serverless，一开始看到 server 还以为是后端的技术。了解之后才发现原来这玩意更倾向前端。

那 Serverless 到底是什么呢？

根据 CNCF 的定义，无服务器计算是指构建和运行不需要服务器管理的应用程序的概念。

> Serverless computing refers to the concept of building and running applications that do not require server management. --- CNCF

Severless 可以分为两个部分 FasS + BasS

### FasS (Function as a Service) 函数即服务

FasS 就是一些运行函数的平台，例如小程序中的云函数、阿里云的函数计算等。

当驱动函数执行的事件到来的时候，首先需要下载代码，然后启动一个容器，在容器里面再启动一个运行环境，最后才是执行代码。

在小程序云开发的 demo 中提供了一个 `login` 的云函数模板。

```js
// 云函数模板
// 部署：在 cloud-functions/login 文件夹右击选择 “上传并部署”

/**
 * 这个示例将经自动鉴权过的小程序用户 openid 返回给小程序端
 *
 * event 参数包含
 * - 小程序端调用传入的 data
 * - 经过微信鉴权直接可信的用户唯一标识 openid
 *
 */
exports.main = (event, context) => {
  console.log(event)
  console.log(context)

  // 可执行其他自定义逻辑
  // console.log 的内容可以在云开发云函数调用日志查看

  return {
    openid: event.userInfo.openId,
  }
}
```

在小程序端可以使用 `wx.cloud.callFunction` 调用云函数

```js
wx.cloud.callFunction({
    name: 'login',
    data: {},
    success: res => {
        app.globalData.openId = res.result.openid;
    },
    fail: () => {},
    complete: () => {}
})
```

对于前端来说调用云函数其实和调用接口比较类似，似乎体现不了 Serverless 的优势。但站在后端开发的角度，使用 Serverless 之后，后端无需搭建运行环境，能够更专注于业务，进行快速开发。

当然了，云函数的业务也可以由前端实现。


### BasS (Backend as a Service) 后端即服务

这里的 Backend 指的是一些后端云服务，例如云数据库、云存储等。

在小程序的云开发中当然也提供了数据库及存储。

小程序云开发的 demo 里提供了上传图片、操作数据库的例子，这里就拿在小程序端操作数据库作为例子，当然在云端同样可以操作数据库，这里就不过多举例。

```js
const db = wx.cloud.database()
// 查询当前用户所有的 counters
db.collection('counters').where({
    _openid: this.data.openid
}).get({
    success: res => {
        this.setData({
            queryResult: JSON.stringify(res.data, null, 2)
        })
        console.log('[数据库] [查询记录] 成功: ', res)
    },
    fail: err => {
        wx.showToast({
            icon: 'none',
            title: '查询记录失败'
        })
        console.error('[数据库] [查询记录] 失败：', err)
    }
})
```

小程序提供的是一个 NoSQL 的数据库，首先需要回去数据库对象，然后通过 collection 获取集合进行操作。

这里可以看出在 Serverless 的架构下，前端的权限更大了，都可以在客户端直接操作数据库了。

还有在客户端直接操作存储的 demo，这里就不再举例。


## Serverless 的特点

**事件驱动**

函数在 FaaS 平台中，需要通过事件来驱动函数执行。例如触发器（定时器）、客户端调用等。

**无状态**

因为每次执行函数，使用的容器不一定相同，所以无法进行内存或数据共享。如果要共享数据，则只能通过第三方服务。

**无运维**

使用 Serverless 并不需要关心服务器。

**低成本**

使用 Serverless 只需为函数执行付费，函数不执行则不花钱。

以上内容参考自[Serverless 掀起新的前端技术变革](https://zhuanlan.zhihu.com/p/65914436)

## 使用 Serverless 与传统应用开发的区别

传统应用开发，需要前后端进行开发、联调，开发完需要将前后端的代码部署到服务器上，这就少不了对服务器的运维。包含运行环境搭建、前后端部署等等。


而使用 Serverless 之后，直接上传云函数就可以部署。无需使用服务器，省去了许多运维成本。


## 总结

Serverless 比较适合用于短时间内处理大量数据的需求，使用了 Serverless 可以避免资源浪费。

具体落地项目可以参考[听上去很美的 Serverless 在中国落地的怎么样了？](https://zhuanlan.zhihu.com/p/100651901)

也许现在公司还不会使用 Serverless，但是多了解一门技术，将来在遇到这样的需求时，才会想起 Serverless 这个选择。

如果想体验 Serverless，还是比较推荐微信小程序云开发，对个人来说使用微信小程序云开发确实非常容易上手。


最后的最后，推广一下我的小程序【实用工具包】

![实用工具包](/imgs/前端/8.png)

本来想开发一个待办提醒，因为有时候快递到了，下班回家需要拿快递，经常到了家才想起来快递没拿。

功能开发完没想到审核不通过，因为涉及备忘录，需要企业主体的小程序。无奈只能屏蔽待办提醒，目前只有视频去水印功能，欢迎各位小伙伴扫码体验，如有需求或者建议也可以在评论区留言。


---

如果有讲的不对的地方，还请各位大佬指点。

如果觉得内容还不错的话，希望小伙伴可以帮忙点赞转发，给更多的同学看到，感谢感谢！


如果你喜欢我的文章，还可以关注我的公众号【前端develop】

![前端develop](/imgs/qrcode.png)