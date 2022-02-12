---
title: 这次终于弄懂Axios是如何中断请求了
date: 2021-11-13
categories:
 - 前端
tags:
 - Axios
 - 源码
---

## Axios 文档案例

先看下 Axios 文档给的例子 https://github.com/axios/axios#cancellation

<!-- more -->

1. 通过 `CancelToken.source` 工厂函数进行取消

```javascript
const CancelToken = axios.CancelToken;
const source = CancelToken.source();

axios.get('/user/12345', {
  cancelToken: source.token
}).catch(function (thrown) {
  if (axios.isCancel(thrown)) {
    console.log('Request canceled', thrown.message);
  } else {
    // handle error
  }
});

axios.post('/user/12345', {
  name: 'new name'
}, {
  cancelToken: source.token
})

// cancel the request (the message parameter is optional)
source.cancel('Operation canceled by the user.');

```

2. 通过 `CancelToken` 构造函数进行取消

```javascript
const CancelToken = axios.CancelToken;
let cancel;

axios.get('/user/12345', {
  cancelToken: new CancelToken(function executor(c) {
    // An executor function receives a cancel function as a parameter
    cancel = c;
  })
});

// cancel the request
cancel();

```

3. 通过 `AbortController` 中断请求，这是 `fetch` 的 api，本文就不再详细介绍了，具体使用可以参考 https://developer.mozilla.org/zh-CN/docs/Web/API/AbortController/AbortController

```javascript
const controller = new AbortController();

axios.get('/foo/bar', {
   signal: controller.signal
}).then(function(response) {
   //...
});
// cancel the request
controller.abort()

```

## 源码分析

首先需要从 GitHub 下载 Axios 源码。如果不想下载，也可以打开 https://github1s.com/axios/axios/ 进行查看。

### 工厂函数 CancelToken.source

通过前面两个例子，可以知道取消请求和 `CancelToken` 这个类息息相关，`CancelToken.source()`工厂函数只不过是在我们看不见的内部帮助我们去实例化一个 `CancelToken` 的实例出来。

那我们先来看下工厂函数的实现。

```javascript
// 文件路径 Axios/lib/cancel/CancelToken.js

// ...

/**
 * Returns an object that contains a new `CancelToken` and a function that, when called,
 * cancels the `CancelToken`.
 */
CancelToken.source = function source() {
  var cancel;
  var token = new CancelToken(function executor(c) {
    cancel = c;
  });
  return {
    token: token,
    cancel: cancel
  };
};

module.exports = CancelToken;

```

可以看到 `CancelToken.source` 这个工厂函数就是帮助我们实例化了一个 `CancelToken` 的实例，然后返回给我们需要使用的 **实例(token)** 和 **取消请求的函数(cancel)** 。

接下来我们继续深入 `CancelToken` 内部，看看为什么执行了 `cancel` 函数后，请求就中断了。

### CancelToken 类

```javascript
// 文件路径 Axios/lib/cancel/CancelToken.js

// ...

/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @class
 * @param {Function} executor The executor function.
 */
function CancelToken(executor) {
  if (typeof executor !== 'function') {
    throw new TypeError('executor must be a function.');
  }

  var resolvePromise;

  this.promise = new Promise(function promiseExecutor(resolve) {
    resolvePromise = resolve;
  });

  var token = this;

  // eslint-disable-next-line func-names
  this.promise.then(function(cancel) {
    if (!token._listeners) return;

    var i;
    var l = token._listeners.length;

    for (i = 0; i < l; i++) {
      token._listeners[i](cancel);
    }
    token._listeners = null;
  });

  // eslint-disable-next-line func-names
  this.promise.then = function(onfulfilled) { // ...
  };

  executor(function cancel(message) {
    if (token.reason) {
      // Cancellation has already been requested
      return;
    }

    token.reason = new Cancel(message);
    resolvePromise(token.reason);
  });
}

// ...

```

通过文档中的例子可以看出，在发起请求的时候传入了 `cancelToken`，也就是 `CancelToken` 的一个实例。

实例化的过程中会调用我们传入的 `executor`函数，将 `cancel` 函数传递给我们外部。

另外这个实例上有一个 `promise` 的属性，当我们调用 `cancel` 函数，`promise` 则会从 `pending` 的状态变成 `fulfilled`。从而触发 `promise.then`，执行所有的 `token._listeners`。


`token._listeners` 又从何而来？

答案还是在当前的文件中

```javascript
// 文件路径 Axios/lib/cancel/CancelToken.js

// ...

/**
 * Subscribe to the cancel signal
 */

CancelToken.prototype.subscribe = function subscribe(listener) {
  // reason 值不为 undefined 说明该请求已取消，可直接调用 listener
  if (this.reason) {
    listener(this.reason);
    return;
  }

  if (this._listeners) {
    this._listeners.push(listener);
  } else {
    this._listeners = [listener];
  }
};

// ...

```

在 `CancelToken` 的原型对象上添加了 `subscribe` 方法，用于订阅取消请求的事件。如果该请求已被取消，则会立即调用 `listener`，否则会将 `listener` 保存在 `_listeners` 数组中。

当我们调用 `cancel` 也就是取消请求的时候，`_listeners` 中保存的 `listener` 则会被调用（见上文）。

这时候并没有看到中断请求的操作，具体的逻辑是在 `listener` 内部，这样写的原因就是可以进行解耦，提高代码的复用性。

另外还有一个 `unsubscribe` 取消订阅就不再展开了。

这就是典型的订阅发布模式。


### 取消请求

最快速的方法就是搜索 `config.cancelToken.subscribe`，这样就可以快速定位到取消请求的具体实现。

只搜索 lib 文件夹即可，可以看到有两处地方，一个是 `lib/adapters/http.js`，另一个是 `lib/adapters/xhr.js`。

因为 Axios 是一个支持 node.js 和浏览器的 http 客户端。这里应用了适配器的模式来兼容这两个平台。本文研究的是取消请求，就不去深究这部分了，我们看其中之一就好了。

```javascript
// Axios/lib/adapters/xhr.js

// ...
    if (config.cancelToken || config.signal) {
      // Handle cancellation
      // eslint-disable-next-line func-names
      onCanceled = function(cancel) {
        if (!request) {
          return;
        }
        reject(!cancel || (cancel && cancel.type) ? new Cancel('canceled') : cancel);
        request.abort();
        request = null;
      };

      config.cancelToken && config.cancelToken.subscribe(onCanceled);
      if (config.signal) {
        config.signal.aborted ? onCanceled() : config.signal.addEventListener('abort', onCanceled);
      }
    }

// ...
```

从 187 行这里开始，我们可以看到 `config.cancelToken.subscribe(onCanceled)` 往 `cancelToken` 注册了一个中断请求的回调。`request.abort();` 这里的 `request` 是 `XMLHttpRequest` 的一个实例。

另外还有一个函数 `done`，即请求成功或者失败之后会将上面注册的 `onCanceled` 进行取消注册。


至此整个取消请求的逻辑就跑通了。我简单画了个图（画了几个小时），希望能方便大家理解。


![](https://feiben-1253434158.cos.ap-guangzhou.myqcloud.com/PicGo/abortreq.png)


## 结合 Vue 实现离开页面取消未完成的请求

思路就是利用一个对象来管理所有的 `CancelToken` 实例。发起请求之前，把新创建的 `cancelToken` 保存到对象中，请求结束后(包括成功、失败)把对应的实例清除。

再结合 vue-router 的路由守卫，这样就可以在离开页面的时候取消所有未完成的请求。

有些全局的接口需要做特殊处理，比如请求用户信息之类的，这些全局通用的接口就不能再离开页面的时候中断请求。

具体代码这里就不展示了。我写了一个 demo，有需要的小伙伴可以自行查看。

https://github.com/AD-feiben/demos/tree/main/abort-req


最后再重申一点，学习源码是为了学习源码中优秀的设计，我们需要思考如何将这个设计应用到我们的项目中，这才是最重要的一点。

希望文章的内容能为你提供一丝丝帮助，如果错误，还望指正。