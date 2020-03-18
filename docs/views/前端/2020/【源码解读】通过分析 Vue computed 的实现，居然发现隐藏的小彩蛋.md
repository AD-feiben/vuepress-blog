---
title: 【源码解读】通过分析 Vue computed 的实现，居然发现隐藏的小彩蛋
date: 2020-03-18
categories:
 - 前端
tags:
 - Vue
 - 源码
---

Vue 的 computed 经常会用到，其中包含以下两个重点：

1、 `computed` 的计算结果会进行缓存；

2、只有在响应式依赖发生改变时才会重新计算结果。

接下从源码的出发，看看能不能验证这两个重点。为了能更好理解 computed 的实现，文章字数会比较多，请耐心阅读。

<!-- more -->

## 源码分析

```js
// vue/src/core/instance/state.js
export function initState (vm: Component) {
  vm._watchers = []
  const opts = vm.$options
  // 初始化 props
  if (opts.props) initProps(vm, opts.props)
  // 初始化 methods
  if (opts.methods) initMethods(vm, opts.methods)
  // 初始化 data
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
  // 初始化 computed
  if (opts.computed) initComputed(vm, opts.computed)
  // 初始化 watch
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}
```

从初始化状态的顺序可以看出，在翻转字符串的例子中会先初始化 `data`，再进行初始化 `computed`。

### data 初始化

先看看初始化 `data` 做了什么，`initData` 源码如下：

```js
// vue/src/core/instance/state.js
function initData (vm: Component) {
  let data = vm.$options.data
  // 兼容 对象或函数返回对象的写法
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}

  // 判断 data 是否为普通对象
  if (!isPlainObject(data)) {
    // data 不是普通对象，重新赋值为空对象，并在输出警告
    data = {}
    ...
  }
  // proxy data on instance
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  while (i--) {
    const key = keys[i]
    // data 的属性不能与 methods、 props 的属性重复
    if (process.env.NODE_ENV !== 'production') {
      // 重复 key，输出警告
      ...
    } else if (!isReserved(key)) {
      // 将每个 key 挂载到实例上，在组件内就可以用 this.key 取值
      proxy(vm, `_data`, key)
    }
  }
  // 监听 data
  // observe data
  observe(data, true /* asRootData */)
}
```

初始化 data，主要做了 3 点，1、属性名重复的判断；2、将属性挂载到 vm 上；3、监听 data。

接下来看看 `observe` 的实现，源码如下：

```js
// vue/src/core/observer/index.js
export function observe (value: any, asRootData: ?boolean): Observer | void {
  // 非对象 或者是 VNode，直接 return
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    // 存在 '__ob__' 属性，表示已经监听
    ob = value.__ob__
  } else if (
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    // 开始创建监听
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}
```

接下来则到了 `Observer` 类，源码如下：

```js
// vue/src/core/observer/index.js
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data

  constructor (value: any) {
    this.value = value
    this.dep = new Dep()
    this.vmCount = 0
    // 将 '__ob__' 挂载到 value 上，避免重复监听
    def(value, '__ob__', this)
    if (Array.isArray(value)) {
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
      this.observeArray(value)
    } else {
      this.walk(value)
    }
  }

  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      // 将对象每个属性添加 getter、 setter
      defineReactive(obj, keys[i])
    }
  }

  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
     // 对数组的每一项进行监听
      observe(items[i])
    }
  }
}
```

接下来会调用 `defineReactive`，源码如下：

```js
// vue/src/core/observer/index.js
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  // dep 用于依赖收集
  const dep = new Dep()

  ...

  // data 的值有可能包含数组、对象，在这里 data 的值进行监听
  let childOb = !shallow && observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      const value = getter ? getter.call(obj) : val
      // Dep.target 是一个静态属性
      // 给 data 的属性添加 getter 时，target 为 undefined，不会进行依赖收集
      // 当 computed 用了 data中的属性时时将会进行依赖收集，先跳过这部分，等到了 computed 再回来看
      if (Dep.target) {
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      const value = getter ? getter.call(obj) : val
      ...
      // #7981: for accessor properties without setter
      if (getter && !setter) return
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      childOb = !shallow && observe(newVal)
      // 当值发生变化时，通知所有订阅者进行更新
      dep.notify()
    }
  })
}
```

`defineReactive` 中用到了 `Dep` 用来进行依赖收集，接下来看看 `Dep` 的源码：

```js
// vue/src/core/observer/dep.js
export default class Dep {
  static target: ?Watcher;
  id: number;
  subs: Array<Watcher>;

  constructor () {
    this.id = uid++
    this.subs = []
  }

  // 添加订阅者
  addSub (sub: Watcher) {
    this.subs.push(sub)
  }
  // 删除订阅者
  removeSub (sub: Watcher) {
    remove(this.subs, sub)
  }

  // 将 Dep 实例传递给目标 Watcher 上，目标 Watcher 再通过 addSub 进行订阅
  depend () {
    // 只有目标 Watcher 存在才可以进行订阅
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  // 通知订阅者
  notify () {
    // 根据 Watcher id 进行排序，通知更新
    const subs = this.subs.slice()
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      subs.sort((a, b) => a.id - b.id)
    }
    for (let i = 0, l = subs.length; i < l; i++) {
      // 调用订阅 Watcher 的 update 方法进行更新
      subs[i].update()
    }
  }
}

Dep.target = null
const targetStack = []

// 添加目标 Watcher，并将 Dep.target 指向最新的 Wathcer
export function pushTarget (target: ?Watcher) {
  targetStack.push(target)
  Dep.target = target
}

// 移除目标 Watcher，并将 Dep.target 指向 targetStack 的最后一个
export function popTarget () {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
```

`Dep` 其实就是一个订阅发布模式，说明一下最主要的两个地方

1、`pushTarget`、`popTarget`

这两个方法中用到了 targetStack 堆栈，这样做就可以进行嵌套，比如在给某个 Watcher 收集依赖的时候，发现了新的 Watcher 需要收集依赖，这样就可以 target 指向新的 Watcher，先把新的 Watcher 收集完再 popTarget，再进行上一个 Watcher 的收集。


2、`depend`

`depend` 执行的是 Watcher 的 `addDep` 方法，看看 `addDep` 怎么写的

```js
// vue/src/core/observer/watcher.js
addDep (dep: Dep) {
  const id = dep.id
  if (!this.newDepIds.has(id)) {
    this.newDepIds.add(id)
    this.newDeps.push(dep)
    if (!this.depIds.has(id)) {
      dep.addSub(this)
    }
  }
}
```

`addDep` 做了一些判断避免重复订阅，再调用 `addSub` 添加订阅。


再回过头来看看 `initData` 。

```js
// vue/src/core/instance/state.js
function initData (vm: Component) {
  let data = vm.$options.data
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}
  ...
}
```

当 `data` 是一个函数时，会调用 `getData` 获取 `data` 函数的返回值，看看 `getData` 的实现。

```js
// vue/src/core/instance/state.js
export function getData (data: Function, vm: Component): any {
  // #7573 disable dep collection when invoking data getters
  pushTarget()
  try {
    return data.call(vm, vm)
  } catch (e) {
    handleError(e, vm, `data()`)
    return {}
  } finally {
    popTarget()
  }
}
```

可以看到在执行 `data` 函数前后，执行了 `pushTarget` 和 `popTarget` 的操作，因为 `data` 的属性并不依赖其他响应式变量、在设置 `getter` 和 `setter` 时，因为 `dep.target`为 `undefined` 所以并不会收集依赖。


data 的初始化到这里就差不多了，接下来看看 computed 的初始化。


### computed 初始化

同样的，先从 `initComputed` 方法开始

```js
// vue/src/core/instance/state.js
const computedWatcherOptions = { lazy: true }

function initComputed (vm: Component, computed: Object) {
  // 创建空对象，绑定到 vm._computedWatchers 上
  const watchers = vm._computedWatchers = Object.create(null)
  // computed properties are just getters during SSR
  const isSSR = isServerRendering()

  for (const key in computed) {
    const userDef = computed[key]
    // computed 如果是函数就当成 getter，如果是对象则取 get 方法
    const getter = typeof userDef === 'function' ? userDef : userDef.get
    // getter 不存在时，输出警告
    ...

    if (!isSSR) {
      // 为 computed 的每个属性创建 Watcher
      // Watcher 是引用变量，vm._computedWatchers 也会被修改
      watchers[key] = new Watcher(
        vm,
        getter || noop,
        noop,
        computedWatcherOptions
      )
    }

    // 此时 key 还没挂载到 vm
    if (!(key in vm)) {
      defineComputed(vm, key, userDef)
    } else if (process.env.NODE_ENV !== 'production') {
      // key 在 data 或者 props 存在，输出警告
    }
  }
}
```

`initComputed` 会给 computed 的每个属性创建 Watcher（服务端渲染不会创建 Watcher）， 然后调用 `defineComputed`。先看看 `new Watcher` 的构造函数做了什么

```js
// vue/sct/core/observe/watcher.js
constructor (
  vm: Component,
  expOrFn: string | Function,
  cb: Function,
  options?: ?Object,
  isRenderWatcher?: boolean
) {
  this.vm = vm
  if (isRenderWatcher) {
    // 渲染 Watcher
    vm._watcher = this
  }
  vm._watchers.push(this)
  // options
  if (options) {
    this.deep = !!options.deep
    this.user = !!options.user
    this.lazy = !!options.lazy
    this.sync = !!options.sync
    this.before = options.before
  } else {
    this.deep = this.user = this.lazy = this.sync = false
  }
  this.cb = cb
  this.id = ++uid // uid for batching
  this.dirty = this.lazy // for lazy watchers
  // 还有其他属性的赋值
  ...

  // parse expression for getter
  if (typeof expOrFn === 'function') {
    this.getter = expOrFn
  } else {
    // 解析表达式，得到 getter 函数
    this.getter = parsePath(expOrFn)
    if (!this.getter) {
      this.getter = noop
      // getter 为空时，输出警告
      ...
    }
  }

  // lazy 为 true 时，将 value 赋值为 undefined，否则调用 get 函数计算 value
  this.value = this.lazy
    ? undefined
    : this.get()
}
```

看看 `defineComputed` 传了哪些参数给这个构造函数。

```js
const computedWatcherOptions = { lazy: true }
...
  watchers[key] = new Watcher(
    vm,
    getter || noop,
    noop,
    computedWatcherOptions
  )
...
```

可以从上面看到 computed 属性创建 `Watcher` 时，`lazy` 为 `true`，也就是在 computed 中声明了属性也不使用，那么将不会计算该属性的结果，value 为 undefined。

顺便看下 Watcher 的 `get` 方法

```js
// vue/sct/core/observe/watcher.js
get () {
  // 将该 Watcher push 到 Dep 的 targetStack 中，开启依赖收集的模式
  pushTarget(this)
  let value
  const vm = this.vm
  try {
    // 执行 computed 中的 get 函数
    // 如果函数内使用了 data 中的属性，那么就会触发 defineProperty 中 get
    value = this.getter.call(vm, vm)
  } catch (e) {
    if (this.user) {
      handleError(e, vm, `getter for watcher "${this.expression}"`)
    } else {
      throw e
    }
  } finally {
    // "touch" every property so they are all tracked as
    // dependencies for deep watching
    if (this.deep) {
      traverse(value)
    }
    // 完成依赖收集
    popTarget()
    this.cleanupDeps()
  }
  return value
}
```

这里就可以看到在调用 get 函数时，会将当前的 Watcher 指定为 Dep.target，然后开始执行 computed 属性的 get 函数，如果 computed 属性的 get 函数内使用了 data 中的属性，那么就会触发 defineProperty 中的 getter。这就验证了开头说的第二点：**只有在响应式依赖发生改变时才会重新计算结果。**

```js
// vue/src/core/observer/index.js
Object.defineProperty(obj, key, {
  enumerable: true,
  configurable: true,
  get: function reactiveGetter () {
    const value = getter ? getter.call(obj) : val
    // 这个时候 target 为 computed 属性的 Watcher，然后将 data 属性的 dep 收集到 computed 属性的 Watcher 中
    if (Dep.target) {
      dep.depend()
      if (childOb) {
        childOb.dep.depend()
        if (Array.isArray(value)) {
          dependArray(value)
        }
      }
    }
    return value
  },
  set: {
    ...
    // data 的属性发生变化，通知订阅者进行更新
    dep.notify()
  }
})
```

从这里可以看出 Vue 设计的非常巧妙，通过执行 computed 属性的 get 函数，就可以完成所有依赖的收集，当这些依赖发生变化时，又会通知 computed 属性的 Watcher 进行更新。

接着看回 `defineComputed`

```js
// vue/src/core/instance/state.js
export function defineComputed (
  target: any,
  key: string,
  userDef: Object | Function
) {
  // 客户端渲染时，shouldCache 为 true，也就是对计算结果进行缓存。
  const shouldCache = !isServerRendering()
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = shouldCache
      ? createComputedGetter(key)
      : createGetterInvoker(userDef)
    sharedPropertyDefinition.set = noop
  } else {
    sharedPropertyDefinition.get = userDef.get
      ? shouldCache && userDef.cache !== false
        ? createComputedGetter(key)
        : createGetterInvoker(userDef.get)
      : noop
    sharedPropertyDefinition.set = userDef.set || noop
  }
  if (process.env.NODE_ENV !== 'production' &&
      sharedPropertyDefinition.set === noop) {
    // 开发环境 computed 属性的 set 函数为空函数时，替换为输出警告的函数
    ...
  }
  // 将 computed 的属性挂载到 vm 上，这样就可以用 this.key 调用 computed 的属性
  Object.defineProperty(target, key, sharedPropertyDefinition)
}
```

从这里可以看到，当对计算结果需要缓存，则会调用 `createComputedGetter`，如果计算结果不需要缓存，则会调用 `createGetterInvoker`。

#### 官方彩蛋

从这里还可以看到一个可以在开发时的小技巧，当 computed 的属性为对象时，还可以自定义是否需要缓存。

官方文档好像没提到这一点，可能是觉得不缓存就和 `methods` 一样，就没有提到，这可能就是彩蛋吧。

```js
computed: {
  noCacheDemo: {
    get () { ... },
    set () { ... },
    cache: false
  }
}
```

回到正题，看看 `createComputedGetter` 做了什么。

```js
// vue/src/core/instance/state.js
function createComputedGetter (key) {
  return function computedGetter () {
    // watcher 为 initComputed 中创建的 watcher
    const watcher = this._computedWatchers && this._computedWatchers[key]
    if (watcher) {
      // watcher 初始化时，dirty 的值与 lazy 相同，都为 true
      // 那么第一次获取 computed 属性的值将会执行 watcher.evaluate()
      // evaluate 中会将 dirty 置为 false
      if (watcher.dirty) {
        watcher.evaluate()
      }
      // 如果处于收集依赖的模式，调用 watcher 的 depend 进行依赖收集
      if (Dep.target) {
        watcher.depend()
      }
      // 返回 watcher.value，而不是执行 computed 属性的 get 函数计算结果
      return watcher.value
    }
  }
}
```

再看下 watcher 的 evaluate 函数

```js
// vue/sct/core/observe/watcher.js
evaluate () {
  this.value = this.get()
  this.dirty = false
}
```

这里可以看到，如果 computed 的计算结果需要缓存时，在第一次使用 computed 属性时会执行 watcher 的 get 函数，在执行 computed 属性的函数的过程中完成依赖的收集，并将计算结果赋值给 watcher的 value 属性。

之后再调用 computed 的属性则会取 watcher.value 的值，而不用执行 computed 属性的 get 函数，就这样做到了缓存的效果。也就验证了开头提到的第一点：**`computed` 的计算结果会进行缓存。**

最后再看看不使用缓存时的做法，`createGetterInvoker` 函数

```js
// vue/sct/core/instance/state.js
function createGetterInvoker(fn) {
  return function computedGetter () {
    return fn.call(this, this)
  }
}
```

其实做法非常简单，就是每次调用就执行 computed 属性的 get 函数。

## 总结

总结一下 computed 的实现过程，主要有以下几个方面：

1、给 computed 的每个属性创建 Watcher

2、第一个使用 computed 的属性时，将会执行该属性的 get 函数，并完成依赖收集，完后将结果保存在对应 Watcher 的 value 中，对计算结果进行缓存。

3、当依赖发生变化时，Dep 会发布通知，让订阅的 Watcher 进行更新的操作。

最后感谢各位小伙伴看到这里，Vue computed 的实现过程都过了一遍，希望能够对各位小伙伴有所帮助。

如果有讲的不对的地方，可以评论指出哦。如果还有不了解的地方，欢迎关注我的公众号给我留言哦。

---

如果还有其他疑问，欢迎大家扫码关注我的公众号【前端develop】给我留言。

![前端develop](/imgs/qrcode.png)
