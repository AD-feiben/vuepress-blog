---
title: 深入 Vue3 源码，学习初始化流程
date: 2021-08-26
categories:
 - 前端
tags:
 - Vue3
 - 源码
---


## 搭建调试环境

为了弄清楚 Vue3 的初始化，建议先克隆 Vue3 到本地。

```bash
git clone https://github.com/vuejs/vue-next.git
```

安装依赖

```bash
npm install
```

<!-- more -->

修改 package.json，将 dev 命令加上 `--sourcemap` 方便调试，并运行 `npm run dev`

```json
// package.json
...
"scripts": {
  "dev": "node scripts/dev.js --sourcemap",
  ...
}
...
```

在 packages/vue 目录下增加 index.html，内容如下

```html
<!-- index.html -->
<div id="app">
  {{ count }}
</div>
<script src="./dist/vue.global.js"></script>
<script>
  Vue.createApp({
    setup() {
      const count = Vue.ref(0);
      return { count };
    }
  }).mount('#app');
</script>
```

在浏览器打开 index.html，程序正常运行则可以开始进行下一步调试。

## 进行调试

> 假如在下面的流程中迷失了方向，建议先看一下结尾的总结，再回过头来看这一段。

![调试](https://feiben-1253434158.cos.ap-guangzhou.myqcloud.com/blogimage-20210825163424230.png)

在 createApp 的位置打上断点，然后刷新页面进断点，开始调试。

具体大家可以自行调试，我在这里就大概描述一下初始化流程。

### createApp

进入 createApp 内部，会跳转到  packages/runtime-dom/src/index.ts 的 createApp，执行完成返回 app 实例。

```ts
// packages/runtime-dom/src/index.ts
export const createApp = ((...args) => {
  const app = ensureRenderer().createApp(...args)
  ...
  return app
}) as CreateAppFunction<Element>
```

接下来继续看 ensureRenderer 的实现。

```ts
// packages/runtime-dom/src/index.ts
function ensureRenderer() {
  return (
    renderer ||
    (renderer = createRenderer<Node, Element | ShadowRoot>(rendererOptions))
  )
}
```

这里的 renderer 是个单例，初始时会调用 createRenderer 创建，再继续深入。

来到 packages/runtime-core/src/renderer.ts，可以看到 createRenderer 又会调用 baseCreateRenderer。

```ts
// packages/runtime-core/src/renderer.ts
export function createRenderer<
  HostNode = RendererNode,
  HostElement = RendererElement
>(options: RendererOptions<HostNode, HostElement>) {
  return baseCreateRenderer<HostNode, HostElement>(options)
}
```

baseCreateRenderer 的实现有 2000 行，我们只需要关注几个关键点就可以了。

![](https://feiben-1253434158.cos.ap-guangzhou.myqcloud.com/blog20210825175058.png)

其返回值也就是 ensureRenderer() 的返回值

```ts
// packages/runtime-core/src/renderer.ts
function baseCreateRenderer(
  options: RendererOptions,
  createHydrationFns?: typeof createHydrationFunctions
): any {
    // 此处省略 2000 行
  return {
    render,
    hydrate,
    createApp: createAppAPI(render, hydrate)
  }
}
```

接下来回到开始的位置，在执行完 ensureRenderer() 后会接着执行 createApp，这个 createApp 就是上一步返回的 createApp，再接着看看做了哪些工作。

```ts
// packages/runtime-dom/src/index.ts
export const createApp = ((...args) => {
  const app = ensureRenderer().createApp(...args)
  ...
  return app
}) as CreateAppFunction<Element>
```

ensureRenderer 返回的 createApp 由 createAppAPI 实现，接下来再看看 createAppAPI 是如何实现的吧。

```ts
// packages/runtime-core/src/apiCreateApp.ts
export function createAppAPI<HostElement>(
  render: RootRenderFunction,
  hydrate?: RootHydrateFunction
): CreateAppFunction<HostElement> {
  return function createApp(rootComponent, rootProps = null) {
    const app: App = (context.app = {
      _uid: uid++,
      _component: rootComponent as ConcreteComponent,
      _props: rootProps,
      _container: null,
      _context: context,
      _instance: null,

      version,

      get config() {},

      set config(v) {},

      use(plugin: Plugin, ...options: any[]) {},

      mixin(mixin: ComponentOptions) {},

      component(name: string, component?: Component): any {},

      directive(name: string, directive?: Directive) {},

      mount(
        rootContainer: HostElement,
        isHydrate?: boolean,
        isSVG?: boolean
      ): any {},

      unmount() {},

      provide(key, value) {}
    })
    return app
  }
}
```

可以看到 createAppAPI 会返回一个 createApp 函数，也就是我们调用 createApp，当 createApp 执行完之后会返回 app 实例。app 实例还会有 use、mixin、component、directive 等方法，可以为全局 app 添加一些扩展。

案例如下，传入的第一个参数为上一步的 rootComponent 也就是根组件。

```js
// index.html
const app = Vue.createApp({})
	.use(xxx)
	.component(xxx)
	.mount(xxx)
```



### mount

createApp 创建 app 实例后，要渲染到页面上还需要调用 mount。接下来看看 mount 又做了什么工作。还是在 createAppAPI 内部

```ts
// packages/runtime-core/src/apiCreateApp.ts
mount(
  rootContainer: HostElement,
  isHydrate?: boolean,
  isSVG?: boolean
): any {
  if (!isMounted) {
    const vnode = createVNode(
      rootComponent as ConcreteComponent,
      rootProps
    )
		...
    if (isHydrate && hydrate) {
      hydrate(vnode as VNode<Node, Element>, rootContainer as any)
    } else {
      render(vnode, rootContainer, isSVG)
    }
    isMounted = true
    app._container = rootContainer
    ...
    return vnode.component!.proxy
  } else if (__DEV__) {
    // 开发环境警告提醒，app 不可以重复挂载
  }
}
```

最终会执行 `render(vnode, rootContainer, isSVG)` 这一行代码，接下来看看调用 createAppAPI 时传入的 renderer。

回到 baseCreateRenderer 中，可以看到在 return 时调用 createAppAPI 传入的 renderer。

```ts
// packages/runtime-core/src/renderer.ts
function baseCreateRenderer(
  options: RendererOptions,
  createHydrationFns?: typeof createHydrationFunctions
): any {
    // 此处省略 2000 行
  return {
    render,
    hydrate,
    createApp: createAppAPI(render, hydrate)
  }
}
```

其中 renderer 在 baseCreateRenderer 中定义了

```ts
const render: RootRenderFunction = (vnode, container, isSVG) => {
  if (vnode == null) {
    if (container._vnode) {
      unmount(container._vnode, null, null, true)
    }
  } else {
    patch(container._vnode || null, vnode, container, null, null, null, isSVG)
  }
  flushPostFlushCbs()
  container._vnode = vnode
}
```

在 index.html 的例子中，第一次执行 render 时 vnode 是由 `rootComponent` 创建出来，rootComponent 则是 createApp 时传入的对象。

 `container` 为 app 容器，也就是 id 为 app 的 div , `container._vnode` 为 `undefined`。 

所以最终会进入 patch 。

patch 的逻辑同样位于 baseCreateRenderer 中。代码太长了，这里就讲一下思路。在 patch 中会判断 vnode 的 type 或 shapeFlag 执行对应的操作。

![](https://feiben-1253434158.cos.ap-guangzhou.myqcloud.com/PicGo/20210825231143.png)

因为第一次 patch 时，vnode 是一个组件，会进入 `ShapeFlags.COMPONENT` 的判断内，执行 `processComponent `进行组件的处理。

然后会触发 `mountComponent` 挂载组件，从而触发 `setupComponent(instance)` 初始化组件的 props、slots、setup 等将需要 proxy 代理的数据做好准备，以及将 template 进行编译为 render。

```ts
// packages/runtime-core/src/renderer.ts
const mountComponent: MountComponentFn = (
  initialVNode,
  container,
  anchor,
  parentComponent,
  parentSuspense,
  isSVG,
  optimized
) => {
  // 2.x compat may pre-creaate the component instance before actually
  // mounting
  const compatMountInstance =
        __COMPAT__ && initialVNode.isCompatRoot && initialVNode.component
  const instance: ComponentInternalInstance =
        compatMountInstance ||
        (initialVNode.component = createComponentInstance(
          initialVNode,
          parentComponent,
          parentSuspense
        ))
	...
  // resolve props and slots for setup context
  if (!(__COMPAT__ && compatMountInstance)) {
    ...
    setupComponent(instance)
    ...
  }
  ...
  setupRenderEffect(
    instance,
    initialVNode,
    container,
    anchor,
    parentSuspense,
    isSVG,
    optimized
  )
  ...
}
```



紧接着会执行 `setupRenderEffect`，该方法会将渲染函数封装成一个副作用，当依赖的响应式数据发生变化时，会自动重新执行。

重点关注 `componentUpdateFn`，代码太长了，这里也简单讲下吧，第一次会执行 `instance.isMounted` 为 undefined，则会进入创建流程，其中会执行 `const subTree = (instance.subTree = renderComponentRoot(instance))` 创建子树，然后通过 patch 递归创建子节点，结束后 `instance.isMounted = true`。

一旦依赖发生变化，`componentUpdateFn`会被重新执行，`instance.isMounted` 为 true，则会尽心更新的处理，具体就不再展开了。

至于为什么依赖发生变化 `componentUpdateFn`会被重新执行，这个我们留在下一篇文章中介绍，记得关注我。

## 总结

1. 在 index.html 调用 `createApp` 时会先经过`ensureRenderer` 和 `baseCreateRenderer` 生成下面的对象

```ts
// baseCreateRenderer 返回值
return {
  render,
  hydrate,
  createApp: createAppAPI(render, hydrate)
}
```

2. 继续调用 `baseCreateRenderer` 返回的 `createApp`，这里的 `createApp` 实际上调用的是 `createAppAPI` 返回的函数。



   `createAppAPI`执行完成返回 app 实例。



3. index.html 在创建好 app 后接着调用 `mount` 进行挂载，`mount` 的实现在 `createAppAPI` 内部。



   `mount` 执行时会调用 `render`函数，该 `render` 在 `baseCreateRenderer` 传入。



4. `render` 则开始 `patch` 进行渲染，`patch` 内部会进行递归渲染子节点。





以上就是 Vue3 的 createApp 和 mount 的大致流程。至于第一步为什么需要经过 `ensureRenderer` 和 `baseCreateRenderer`？

`baseCreateRenderer` 主要是平台无关的逻辑处理，存放在 runtime-core 中。

当 `patch` 的时候需要操作 dom，则会调用外部传入的方法进行操作，这样就可以更方便实现跨端。

`ensureRenderer` 存放在 runtime-dom 中，主要为 `baseCreateRenderer` 提供一系列 dom 操作的函数。

假如我们要自定义渲染器，那么只需要实现`ensureRenderer` 即可。而不是像 Vue2 需要 fork 一份，大大提高了 Vue3 的应用范围。

---

好了，这篇文章就水到这里吧。如有错误的地方，希望还能在评论区指出，感谢！

下篇文章将解析 Vue3 的响应式原理，如果有兴趣的话别忘了关注我呀，我们一起学习、进步。


