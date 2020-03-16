---
title: 【面试题解析】手动实现Promise
date: 2020-03-17
categories:
 - 前端
tags:
 - Promise
 - 面试题
---

前端面试的时候，经常能看到这样一道题，`实现一个Promise`。

这篇文章将一步步实现 Promise，彻底弄懂 Promise。

## Promise 基本构成

平时使用 Promise 我们可以知道 Promise 存在三种状态 Pending、Resolve、Reject，在 `new Promise` 时需要传入一个函数, 参数为 `resolve` 和 `reject` 的函数，这两个函数用来改变 Promise 的状态。

最重要的还有个 `then` 的方法，`then` 函数可以传入两个函数作为参数，第一个函数用来获取异步操作的结果，第二个函数用来获取错误的原因。

除此之外还需要 `value` 和 `reason` 存放 Promise 的结果或错误原因。

从上面这些信息可以转化为下面的代码：

```js
const PENDING = 'pending';
const RESOLVED = 'resolved';
const REJECTED = 'rejected';

class Promise {
  constructor(executor) {
    this.status = PENDING;
    this.value = null;
    this.reason = null;

    function resolve (value) {
      this.status = RESOLVED;
      this.value = value;
    };

    function reject (reason) {
      this.status = REJECTED;
      this.reason = reason;
    };

    executor(resolve.bind(this), reject.bind(this));
  }

  then(onFulfilled, onRejected) {
    if (this.status === RESOLVED) {
      onFulfilled(this.value);
    }

    if (this.status === REJECTED) {
      onRejected(this.reason);
    }
  }
}
```

Promise 的状态只允许修改一次，那么 `resolve` 和 `reject` 需要加上状态判断。

```js
function resolve (value) {
  if (this.status !== PENDING) return;
  this.status = RESOLVED;
  this.value = value;
};

function reject (reason) {
  if (this.status !== PENDING) return;
  this.status = REJECTED;
  this.reason = reason;
};
```

在调用 `then` 函数时，Promise 的状态有可能还是 Pending 的状态，这时需要将 `then` 函数的两个参数进行保存，状态改变时在进行调用。`then` 函数有可能会调用多次，那么可以用数组保存参数。

```js
class Promise {
  constructor(executor) {
    // ...
    this.resolveCbs = [];
    this.rejectCbs = [];
    function resolve (value) {
      // ...
      this.resolveCbs.map(fn => fn(this.value));
    };

    function reject (reason) {
      // ...
      this.rejectCbs.map(fn => fn(this.reason));
    };
  }

  then(onFulfilled, onRejected) {
    // ...
    if (this.status === PENDING) {
      this.resolveCbs.push(onFulfilled);
      this.rejectCbs.push(onRejected);
    }
  }
}
```

写到这里，一个最基本的 Promise 就可以使用了。

```js
 new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve(1);
  }, 500);
}).then(res => {
  console.log(res);
});
```

上面的代码虽然完成了最基本的 Promise，但是还未实现 `then` 函数的链式调用。

## 实现链式调用

```js
new Promise((resolve, reject) => {
  // ...
}).then(res => {
  // ...
}).then(res => {
  // ...
})
```

链式调用也是 Promise 的重点所在，因为有了链式调用，才能避免回调地狱的问题。接下来就来一步步实现。

`then` 是 Promise 的方法，为了能够继续调用 `then` 函数，需要 `then` 函数返回一个新的 Promise。

`onFulfilled` 或 `onRejected` 的返回值有可能也是一个 Promise，那么需要等待 Promise 执行完的结果传递给下一个 `then` 函数。如果返回的不是 Promise，就可以将结果传递给下一个 `then` 函数。

将 `then` 函数进行如下修改，resolvePromise 另外实现。

```js
class Promise {
  // ...
  then(onFulfilled, onRejected) {
    let promise2 = new Promise((resolve, reject) => {
      if (this.status === RESOLVED) {
        let x = onFulfilled(this.value);
        resolvePromise(promise2, x, resolve, reject);
      }

      if (this.status === REJECTED) {
        let x = onRejected(this.reason);
        resolvePromise(promise2, x, resolve, reject);
      }

      if (this.status === PENDING) {
        this.resolveCbs.push(() => {
          let x = onFulfilled(this.value);
          resolvePromise(promise2, x, resolve, reject);
        });

        this.rejectCbs.push(() => {
          let x = onRejected(this.reason);
          resolvePromise(promise2, x, resolve, reject);
        });
      }
    });

    return promise2;
  }
}
```

## 实现 resolvePromise

```js
then(onFulfilled, onRejected) {
  function resolvePromise (promise2, x, resolve, reject) {
    if (promise2 === x) {
      // 不允许 promise2 === x; 避免自己等待自己
      return reject(new TypeError('Chaining cycle detected for promise'));
    }

    // 防止重复调用
    let called = false;

    try {
      if (x instanceof Promise) {
        let then = x.then;
        // 第一个参数指定调用对象
        // 第二个参数为成功的回调，将结果作为 resolvePromise 的参数进行递归
        // 第三个参数为失败的回调
        then.call(x, y => {
          if (called) return;
          called = true;
          // resolve 的结果依旧是 Promise 那就继续解析
          resolvePromise(promise2, y, resolve, reject);
        }, err => {
          if (called) return;
          called = true;
          reject(err);
        });
      } else {
        resolve(x);
      }
    } catch (e) {
      reject(e);
    }
  }

  // ...
}
```

## 优化 `then` 函数

`then` 函数的 `onFulfilled` 和 `onRejected` 参数允许不传.

[Promise/A+](https://promisesaplus.com/) 规范要求 `onFulfilled` 和 `onRejected` 不能被同步调用，可以使用 `setTimeout` 改为异步调用。

```js
then(onFulfilled, onRejected) {
  onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => { return v };
  onRejected = typeof onRejected === 'function' ? onRejected : e => { throw e; };

  function resolvePromise (promise2, x, resolve, reject) {...}

  let promise2 = new Promise((resolve, reject) => {
    function fulfilled () {
      setTimeout(() => {
        let x = onFulfilled(this.value);
        resolvePromise(promise2, x, resolve, reject);
      }, 0);
    };

    function rejected () {
      setTimeout(() => {
        let x = onRejected(this.reason);
        resolvePromise(promise2, x, resolve, reject);
      }, 0);
    }

    if (this.status === RESOLVED) {
      fulfilled.call(this);
    }

    if (this.status === REJECTED) {
      rejected.call(this);
    }

    if (this.status === PENDING) {
      this.resolveCbs.push(fulfilled.bind(this));
      this.rejectCbs.push(rejected.bind(this));
    }
  });

  return promise2;
}
```

## catch 等方法实现

```js
class Promise {
  // ...
  catch(fn) {
    this.then(null, fn);
  }

  static resolve (val) {
    return new Promise((resolve) => {
      resolve(val);
    });
  }

  static reject (val) {
    return new Promise((resolve, reject) => {
      reject(val);
    });
  }

  static race(promises) {
    return new Promise((resolve, reject) => {
      promises.map(promise => {
        promise.then(resolve, reject);
      });
    });
  }

  static all(promises) {
    let arr = [];
    let i = 0;
    return new Promise((resolve, reject) => {
      promises.map((promise, index) => {
        promise.then(data => {
          arr[index] = data;
          if (++i === promises.length) {
            resolve(arr);
          }
        }, reject);
      })
    })
  }
}

```

---

如果还有其他疑问，欢迎大家扫码关注我的公众号【前端develop】给我留言。

![前端develop](/imgs/qrcode.png)

