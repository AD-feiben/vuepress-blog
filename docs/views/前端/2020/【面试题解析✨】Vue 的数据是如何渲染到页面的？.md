---
title: 【面试题解析✨】Vue 的数据是如何渲染到页面的？
date: 2020-03-24
categories:
 - 前端
tags:
 - Vue
 - 源码
---

面试的时候，面试官经常会问 `Vue 双向绑定的原理是什么？`我猜大部分人会跟我一样，不假思索的回答利用 `Object.defineProperty` 实现的。

其实这个回答很笼统，而且也没回答完整？Vue 中 `Object.defineProperty` 只是对数据做了劫持，具体的如何渲染到页面上，并没有考虑到。接下来从初始化开始，看看 `Vue` 都做了什么事情。

<!-- more -->

## 前提知识

在读源码前，需要了解 `Object.defineProperty` 的使用，以及 Vue `Dep` 的用法。这里就简单带过，各位大佬可以直接跳过，进行源码分析。

### Object.defineProperty

当使用 `Object.defineProperty` 对对象的属性进行拦截时，调用该对象的属性，则会调用 `get` 函数，属性值则是 `get` 函数的返回值。当修改属性值时，则会调用 `set` 函数。

当然也可以通过 `Object.defineProperty` 给对象添加属性值，Vue 中就是通过这个方法将 `data`、`computed` 等属性添加到 vm 上。

```js
Object.defineProperty(obj, key, {
  enumerable: true,
  configurable: true,
  get: function reactiveGetter () {
    const value = getter ? getter.call(obj) : val
    // 用于依赖收集，Dep 中讲到
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
    val = newVal
    // val 发生变化时，发出通知，Dep 中讲到
    dep.notify()
  }
})
```

### Dep

这里不讲什么设计模式了，直接看代码。

```js
let uid = 0

export default class Dep {
  static target: ?Watcher;
  id: number;
  subs: Array<Watcher>;

  constructor () {
    this.id = uid++
    this.subs = []
  }

  addSub (sub: Watcher) {
    // 添加 Watcher
    this.subs.push(sub)
  }

  removeSub (sub: Watcher) {
    // 从列表中移除某个 Watcher
    remove(this.subs, sub)
  }

  depend () {
    // 当 target 存在时，也就是目标 Watcher 存在的时候，
    // 就可以为这个目标 Watcher 收集依赖
    // Watcher 的 addDep 方法在下文中
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  notify () {
    // 对 Watcher 进行排序
    const subs = this.subs.slice()
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      subs.sort((a, b) => a.id - b.id)
    }
    // 当该依赖发生变化时, 调用添加到列表中的 Watcher 的 update 方法进行更新
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}

// target 为某个 Watcher 实例，一次只能为一个 Watcher 收集依赖
Dep.target = null
// 通过堆栈存放 Watcher 实例，
// 当某个 Watcher 的实例未收集完，又有新的 Watcher 实例需要收集依赖，
// 那么旧的 Watcher 就先存放到 targetStack，
// 等待新的 Watcher 收集完后再为旧的 Watcher 收集
// 配合下面的 pushTarget 和 popTarget 实现
const targetStack = []

export function pushTarget (target: ?Watcher) {
  targetStack.push(target)
  Dep.target = target
}

export function popTarget () {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
```

当某个 Watcher 需要依赖某个 dep 时，那么调用 `dep.addSub(Watcher)` 即可，当 dep 发生变化时，调用 `dep.notify()` 就可以触发 Watcher 的 update 方法。接下来看看 Vue 中 Watcher 的实现。


```js
class Watcher {
  // 很多属性，这里省略
  ...
  // 构造函数
  constructor (
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options?: ?Object,
    isRenderWatcher?: boolean
  ) { ... }

  get () {
    // 当执行 Watcher 的 get 函数时，会将当前的 Watcher 作为 Dep 的 target
    pushTarget(this)
    let value
    const vm = this.vm
    try {
      // 在执行 getter 时，当遇到响应式数据，会触发上面讲到的 Object.defineProperty 中的 get 函数
      // Vue 就是在 Object.defineProperty 的 get 中调用 dep.depend() 进行依赖收集。
      value = this.getter.call(vm, vm)
    } catch (e) {
      ...
    } finally {
      ...
      // 当前 Watcher 的依赖收集完后，调用 popTarget 更换 Watcher
      popTarget()
      this.cleanupDeps()
    }
    return value
  }

  // dep.depend() 收集依赖时，会经过 Watcher 的 addDep 方法
  // addDep 做了判断，避免重复收集，然后调用 dep.addSub 将该 Watcher 添加到 dep 的 subs 中
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
}
```

通过 `Object.defineProperty` 中的 `get`，`Dep` 的 `depend` 以及 `Watcher` 的 `addDep` 这三个函数的配合，完成了依赖的收集，就是将 `Watcher` 添加到 `dep` 的 `subs` 列表中。

当依赖发生变化时，就会调用 `Object.defineProperty` 中的 `set`，在 `set` 中调用 `dep` 的 `notify`，使得 `subs` 中的每个 `Watcher` 都执行 `update` 函数。

`Watcher` 中的 `update` 最终会重新调用 `get` 函数，重新求值并重新收集依赖。

## 源码分析

先看看 `new Vue` 都做了什么?

```js
// vue/src/core/instance/index.js
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    // 只能使用 new Vue 调用该方法，否则输入警告
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  // 开始初始化
  this._init(options)
}
```

`_init` 方法通过原型挂载在 Vue 上

```js
// vue/src/core/instance/init.js
export function initMixin (Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this
    // a uid
    vm._uid = uid++

    let startTag, endTag
    // 初始化前打点，用于记录 Vue 实例初始化所消耗的时间
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // a flag to avoid this being observed
    vm._isVue = true
    // 合并参数到 $options
    if (options && options._isComponent) {
      initInternalComponent(vm, options)
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }

    if (process.env.NODE_ENV !== 'production') {
      // 非生产环境以及支持 Proxy 的浏览器中，对 vm 的属性进行劫持，并将代理后的 vm 赋值给 _renderProxy
      // 当调用 vm 不存在的属性时，进行错误提示。
      // 在不支持 Proxy 的浏览器中，_renderProxy = vm; 为了简单理解，就看成等同于 vm

      // 代码在 src/core/instance/proxy.js
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    // 初始化声明周期函数
    initLifecycle(vm)
    // 初始化事件
    initEvents(vm)
    // 初始化 render 函数
    initRender(vm)
    // 触发 beforeCreate 钩子
    callHook(vm, 'beforeCreate')
    // 初始化 inject
    initInjections(vm) // resolve injections before data/props
    // 初始化 data/props 等
    // 通过 Object.defineProperty 对数据进行劫持
    initState(vm)
    // 初始化 provide
    initProvide(vm) // resolve provide after data/props
    // 数据处理完后，触发 created 钩子
    callHook(vm, 'created')

    // 从 new Vue 到 created 所消耗的时间
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    // 如果 options 有 el 参数则进行 mount
    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}
```

接下来进入 `$mount`，因为用的是完整版的 Vue，直接看 `vue/src/platforms/web/entry-runtime-with-compiler.js` 这个文件。

```js
// vue/src/platforms/web/entry-runtime-with-compiler.js
// 首先将 runtime 中的 $mount 方法赋值给 mount 进行保存
const mount = Vue.prototype.$mount
// 重写 $mount，对 template 编译为 render 函数后再调用 runtime 的 $mount
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && query(el)

  // 挂载元素不允许为 body 或 html
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }

  const options = this.$options
  if (!options.render) {
    let template = options.template
    // render 函数不存在时，将 template 转化为 render 函数
    // 具体就不展开了
    ...
    if (template) {
        ...
    } else if (el) {
      // template 不存在，则将 el 转成 template
      // 从这里可以看出 Vue 支持 render、template、el 进行渲染
      template = getOuterHTML(el)
    }
    if (template) {
      const { render, staticRenderFns } = compileToFunctions(template, {
        outputSourceRange: process.env.NODE_ENV !== 'production',
        shouldDecodeNewlines,
        shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments
      }, this)
      options.render = render
      options.staticRenderFns = staticRenderFns
    }
  }
  // 调用 runtime 中 $mount
  return mount.call(this, el, hydrating)
}
```

查看 runtime 中的 `$mount`

```js
// vue/src/platforms/web/runtime/index.js
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && inBrowser ? query(el) : undefined
  return mountComponent(this, el, hydrating)
}
```

`mountComponent` 定义在 `vue/src/core/instance/lifecycle.js` 中

```js
// vue/src/core/instance/lifecycle.js
export function mountComponent (
  vm: Component,
  el: ?Element,
  hydrating?: boolean
): Component {
  vm.$el = el
  if (!vm.$options.render) {
    // 未定义 render 函数时，将 render 赋值为 createEmptyVNode 函数
    vm.$options.render = createEmptyVNode
    if (process.env.NODE_ENV !== 'production') {
      /* istanbul ignore if */
      if ((vm.$options.template && vm.$options.template.charAt(0) !== '#') ||
        vm.$options.el || el) {
        // 用了 Vue 的 runtime 版本，而没有 render 函数时，报错处理
        warn(
          'You are using the runtime-only build of Vue where the template ' +
          'compiler is not available. Either pre-compile the templates into ' +
          'render functions, or use the compiler-included build.',
          vm
        )
      } else {
        // template 和 render 都未定义时，报错处理
        warn(
          'Failed to mount component: template or render function not defined.',
          vm
        )
      }
    }
  }
  // 调用 beforeMount 钩子
  callHook(vm, 'beforeMount')
  // 定义 updateComponent 函数
  let updateComponent
  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    // 需要做监控性能时，在 updateComponent 内加入打点的操作
    updateComponent = () => {
      const name = vm._name
      const id = vm._uid
      const startTag = `vue-perf-start:${id}`
      const endTag = `vue-perf-end:${id}`

      mark(startTag)
      const vnode = vm._render()
      mark(endTag)
      measure(`vue ${name} render`, startTag, endTag)

      mark(startTag)
      vm._update(vnode, hydrating)
      mark(endTag)
      measure(`vue ${name} patch`, startTag, endTag)
    }
  } else {
    updateComponent = () => {
      // updateComponent 主要调用 _update 进行浏览器渲染
      // _render 返回 VNode
      // 先继续往下看，等会再回来看这两个函数
      vm._update(vm._render(), hydrating)
    }
  }

  // new 一个渲染 Watcher
  new Watcher(vm, updateComponent, noop, {
    before () {
      if (vm._isMounted && !vm._isDestroyed) {
        callHook(vm, 'beforeUpdate')
      }
    }
  }, true /* isRenderWatcher */)
  hydrating = false

  // 挂载完成，触发 mounted
  if (vm.$vnode == null) {
    vm._isMounted = true
    callHook(vm, 'mounted')
  }
  return vm
}
```

先继续往下看，看看 `new Watcher` 做了什么，再回过头看 `updateComponent` 中的 `_update` 和 `_render`。

`Watcher` 的构造函数如下

```js
// vue/src/core/observer/watcher.js
constructor (
  vm: Component,
  expOrFn: string | Function,
  cb: Function,
  options?: ?Object,
  isRenderWatcher?: boolean
) {
  this.vm = vm
  if (isRenderWatcher) {
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
  this.active = true
  this.dirty = this.lazy // for lazy watchers
  ...
  // expOrFn 为上文的 updateComponent 函数，赋值给 getter
  if (typeof expOrFn === 'function') {
    this.getter = expOrFn
  } else {
    this.getter = parsePath(expOrFn)
    if (!this.getter) {
      this.getter = noop
      ...
    }
  }
  // lazy 为 false，调用 get 方法
  this.value = this.lazy
    ? undefined
    : this.get()
}

// 执行 getter 函数，getter 函数为 updateComponent，并收集依赖
get () {
  pushTarget(this)
  let value
  const vm = this.vm
  try {
    value = this.getter.call(vm, vm)
  } catch (e) {
    ...
  } finally {
    if (this.deep) {
      traverse(value)
    }
    popTarget()
    this.cleanupDeps()
  }
  return value
}
```

在 `new Watcher` 后会调用 `updateComponent` 函数，上文中 `updateComponent` 内执行了 `vm._update`，`_update` 执行前会通过 `_render` 获得 vnode，接下里看看 `_update` 做了什么。`_update` 定义在 `vue/src/core/instance/lifecycle.js` 中

```js
// vue/src/core/instance/lifecycle.js
Vue.prototype._update = function (vnode: VNode, hydrating?: boolean) {
  const vm: Component = this
  const prevVnode = vm._vnode
  vm._vnode = vnode
  ...

  if (!prevVnode) {
    // 初始渲染
    vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)
  } else {
    // 更新 vnode
    vm.$el = vm.__patch__(prevVnode, vnode)
  }
  ...
}
```

接下来到了 `__patch__` 函数进行页面渲染。

```js
// vue/src/platforms/web/runtime/index.js
import { patch } from './patch'
Vue.prototype.__patch__ = inBrowser ? patch : noop
```

```js
// vue/src/platforms/web/runtime/patch.js
import { createPatchFunction } from 'core/vdom/patch'
export const patch: Function = createPatchFunction({ nodeOps, modules })
```

`createPatchFunction` 提供了很多操作 virtual dom 的方法，最终会返回一个 `path` 函数。

```js
export function createPatchFunction (backend) {
  ...
  // oldVnode 代表旧的节点，vnode 代表新的节点
  return function patch (oldVnode, vnode, hydrating, removeOnly) {
    // vnode 为 undefined, oldVnode 不为 undefined 则需要执行 destroy
    if (isUndef(vnode)) {
      if (isDef(oldVnode)) invokeDestroyHook(oldVnode)
      return
    }

    let isInitialPatch = false
    const insertedVnodeQueue = []

    if (isUndef(oldVnode)) {
      // oldVnode 不存在，表示初始渲染，则根据 vnode 创建元素
      isInitialPatch = true
      createElm(vnode, insertedVnodeQueue)
    } else {

      const isRealElement = isDef(oldVnode.nodeType)
      if (!isRealElement && sameVnode(oldVnode, vnode)) {
        // oldVnode 与 vnode 为相同节点，调用 patchVnode 更新子节点
        patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly)
      } else {
        if (isRealElement) {
          // 服务端渲染的处理
          ...
        }
        // 其他操作
        ...
      }
    }

    invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch)
    // 最终渲染到页面上
    return vnode.elm
  }
}
```


当渲染 Watcher 的依赖的数据发生变化时，会触发 `Object.defineProperty` 中的 `set` 函数。

从而调用 `dep.notify()` 通知该 Watcher 进行 `update` 操作。最终达到数据改变时，自动更新页面。 `Watcher` 的 `update` 函数就不再展开了，有兴趣的小伙伴可以自行查看。



最后再回过头看看前面遗留的 `_render` 函数。

```js
updateComponent = () => {
  vm._update(vm._render(), hydrating)
}
```

之前说了 `_render` 函数会返回 `vnode`，看看具体做了什么吧。

```js
// vue/src/core/instance/render.js
Vue.prototype._render = function (): VNode {
  const vm: Component = this
  // 从 $options 取出 render 函数以及 _parentVnode
  // 这里的 render 函数可以是 template 或者 el 编译的
  const { render, _parentVnode } = vm.$options

  if (_parentVnode) {
    vm.$scopedSlots = normalizeScopedSlots(
      _parentVnode.data.scopedSlots,
      vm.$slots,
      vm.$scopedSlots
    )
  }

  vm.$vnode = _parentVnode
  let vnode
  try {
    currentRenderingInstance = vm
    // 最终会执行 $options 中的 render 函数
    // _renderProxy 可以看做 vm
    // 将 vm.$createElement 函数传递给 render，也就是经常看到的 h 函数
    // 最终生成 vnode
    vnode = render.call(vm._renderProxy, vm.$createElement)
  } catch (e) {
    // 异常处理
    ...
  } finally {
    currentRenderingInstance = null
  }

  // 如果返回的数组只包含一个节点，则取第一个值
  if (Array.isArray(vnode) && vnode.length === 1) {
    vnode = vnode[0]
  }

  // vnode 如果不是 VNode 实例，报错并返回空的 vnode
  if (!(vnode instanceof VNode)) {
    if (process.env.NODE_ENV !== 'production' && Array.isArray(vnode)) {
      warn(
        'Multiple root nodes returned from render function. Render function ' +
        'should return a single root node.',
        vm
      )
    }
    vnode = createEmptyVNode()
  }
  // 设置父节点
  vnode.parent = _parentVnode
  // 最终返回 vnode
  return vnode
}
```

接下来就是看 `vm.$createElement` 也就是 `render` 函数中的 `h`

```js
// vue/src/core/instance/render.js
import { createElement } from '../vdom/create-element'
export function initRender (vm: Component) {
  ...
  vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
  vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)
  ...
}
```

```js
// vue/src/core/vdom/create-element.js
export function createElement (
  context: Component,
  tag: any,
  data: any,
  children: any,
  normalizationType: any,
  alwaysNormalize: boolean
): VNode | Array<VNode> {
  // data 是数组或简单数据类型，代表 data 没传，将参数值赋值给正确的变量
  if (Array.isArray(data) || isPrimitive(data)) {
    normalizationType = children
    children = data
    data = undefined
  }
  if (isTrue(alwaysNormalize)) {
    normalizationType = ALWAYS_NORMALIZE
  }
  // 将正确的参数传递给 _createElement
  return _createElement(context, tag, data, children, normalizationType)
}

export function _createElement (
  context: Component,
  tag?: string | Class<Component> | Function | Object,
  data?: VNodeData,
  children?: any,
  normalizationType?: number
): VNode | Array<VNode> {
  if (isDef(data) && isDef((data: any).__ob__)) {
    // render 函数中的 data 不能为响应式数据
    process.env.NODE_ENV !== 'production' && warn(
      `Avoid using observed data object as vnode data: ${JSON.stringify(data)}\n` +
      'Always create fresh vnode data objects in each render!',
      context
    )
    // 返回空的 vnode 节点
    return createEmptyVNode()
  }
  // 用 is 指定标签
  if (isDef(data) && isDef(data.is)) {
    tag = data.is
  }
  if (!tag) {
    // in case of component :is set to falsy value
    return createEmptyVNode()
  }
  // key 值不是简单数据类型时，警告提示
  if (process.env.NODE_ENV !== 'production' &&
    isDef(data) && isDef(data.key) && !isPrimitive(data.key)
  ) { ... }

  if (Array.isArray(children) &&
    typeof children[0] === 'function'
  ) {
    data = data || {}
    data.scopedSlots = { default: children[0] }
    children.length = 0
  }
  // 处理子节点
  if (normalizationType === ALWAYS_NORMALIZE) {
    // VNode 数组
    children = normalizeChildren(children)
  } else if (normalizationType === SIMPLE_NORMALIZE) {
    children = simpleNormalizeChildren(children)
  }

  // 生成 vnode
  let vnode, ns
  if (typeof tag === 'string') {
    let Ctor
    ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag)
    if (config.isReservedTag(tag)) {
      ...
      vnode = new VNode(
        config.parsePlatformTagName(tag), data, children,
        undefined, undefined, context
      )
    } else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
      vnode = createComponent(Ctor, data, context, children, tag)
    } else {
      vnode = new VNode(
        tag, data, children,
        undefined, undefined, context
      )
    }
  } else {
    vnode = createComponent(tag, data, context, children)
  }

  // 返回 vnode
  if (Array.isArray(vnode)) {
    return vnode
  } else if (isDef(vnode)) {
    if (isDef(ns)) applyNS(vnode, ns)
    if (isDef(data)) registerDeepBindings(data)
    return vnode
  } else {
    return createEmptyVNode()
  }
}
```

## 总结

代码看起来很多，其实主要流程可以分为以下 4 点：

1、 `new Vue` 初始化数据等

2、`$mount` 将 render、template 或 el 转为 render 函数

3、生成一个渲染 Watcher 收集依赖，并将执行 render 函数生成 vnode 传递给 patch 函数执行，渲染页面。

4、当渲染 Watcher 依赖发生变化时，执行 Watcher 的 getter 函数，重新依赖收集。并且重新执行 render 函数生成 vnode 传递给 patch 函数进行页面的更新。



以上内容均是个人理解，如果有讲的不对的地方，还请各位大佬指点。

如果觉得内容还不错的话，希望小伙伴可以帮忙点赞转发，给更多的小伙伴看到，感谢感谢！

---

如果你喜欢我的文章，还可以关注我的公众号【前端develop】

![前端develop](/imgs/qrcode.png)
