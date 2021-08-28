---
title: 深入 Vue3 源码，学习响应式原理
date: 2021-08-28
categories:
 - 前端
tags:
 - Vue3
 - 源码
---


## Vue2 响应式原理

学过 Vue2 的话应该知道响应式原理是由 Object.defineProperty 对数据进行劫持，再加上订阅发布，实现数据的响应的。

Object.defineProperty 存在以下几个方面的缺点。

1. 初始化的时候需要遍历对象的所有属性进行劫持，如果对象存在嵌套还需要进行递归。导致初始化的时候需要消耗一些资源用于递归遍历。
2. 从上面可以推导出 Vue2 对于新增、删减对象属性是无法进行劫持，需要通过 Vue.set、Vue.delete 进行操作。
3. 每个调用者会生成一个 Watcher，造成内存占用。
4. 无法劫持 Set、Map 对象。

<!-- more -->

## Vue3 响应式原理

针对以上问题，Vue3 改用了 ES6 原生的 Proxy 对数据进行代理。

Proxy 基本用法如下：

```js
const reactive = (target) => {
  return new Proxy(target, {
    get(target, key) {
      console.log("get: ", key);
      // return Reflect.get(target, key);
      return target[key];
    },

    set(target, key, value) {
      console.log("set: ", key, " = ", value);
      // Reflect.set(target, key, value);
      target[key] = value;
      return value;
    },
  });
};

var a = reactive({ count: 1 });
console.log(a.count);

a.count = 2;
console.log(a.count);

// log 输出
// get:  count
// 1
// set:  count  =  2
// get:  count
// 2
```

如此便可检测到数据的变化。接下来只需在 get 进行收集依赖，set 通知依赖更新。

接下来还需借助 effect、track 和 trigger 方法。

effect 函数传入一个回调函数，回调函数会立即执行，并自动与响应式数据建立依赖关系。

track 在 proxy get 中执行，建立依赖关系。

trigger 响应式数据发生变化时，根据依赖关系找到对应函数进行执行。

代码实现如下：

```js
const reactive = (target) => {
  return new Proxy(target, {
    get(target, key) {
      console.log("[proxy get] ", key);
      track(target, key);
      // return Reflect.get(target, key);
      return target[key];
    },

    set(target, key, value) {
      console.log("[proxy set]  ", key, " = ", value);
      // Reflect.set(target, key, value);
      target[key] = value;
      trigger(target, key);
      return value;
    },
  });
};

// 用于存放 effect 传入的 fn，便于 track 时找到对应 fn
const effectStack = [];

// 用于保存 响应式对象 和 fn 的关系
// {
//   target: {
//     key: [fn, fn];
//   }
// }
const targetMap = {};

const track = (target, key) => {
  let depsMap = targetMap[target];
  if (!depsMap) {
    targetMap[target] = depsMap = {};
  }
  let dep = depsMap[key];
  if (!dep) {
    depsMap[key] = dep = [];
  }

  // 建立依赖关系
  const activeEffect = effectStack[effectStack.length - 1];
  dep.push(activeEffect);
};

const trigger = (target, key) => {
  const depsMap = targetMap[target];
  if (!depsMap) return;
  const deps = depsMap[key];
  // 根据依赖关系，找出 fn 并重新执行
  deps.map(fn => {
    fn();
  });
};

const effect = (fn) => {
  try {
    effectStack.push(fn);
    fn();
  } catch (error) {
    effectStack.pop(fn);
  }
};

var a = reactive({ count: 1 });

effect(() => {
  console.log("[effect] ", a.count);
});

a.count = 2;

// log 输出
// [proxy get]  count
// [effect]  1
// [proxy set]   count  =  2
// [proxy get]  count
// [effect]  2

```

以上代码并不是 Vue3 的源码，而是 Vue3 响应式的原理，相比起 Vue2 要更加简单。

执行顺序为

1. 调用 reactive 代理响应式对象；
2. 调用 effect ，会将 fn 保存至 effectStack，在执行 fn 时会触发 Proxy 的 get；
3. 从 Proxy 的 get 触发 track，将数据与 fn 建立关系；
4. 修改响应式数据，触发 Proxy 的 set；
5. 从 Proxy 的 set 触发 trigger，从而找出对应的 fn 并执行。

弄清楚原理再去看源码会简单很多，下面我们一起去看下源码。

## Vue3 响应式源码

Vue3 的响应式是一个独立的模块，不依赖框架，甚至可以在 React、Angular 中使用。

reactive 函数位于 packages/reactivity/src/reactive.ts

```ts
// packages/reactivity/src/reactive.ts
export function reactive(target: object) {
  // if trying to observe a readonly proxy, return the readonly version.
  if (target && (target as Target)[ReactiveFlags.IS_READONLY]) {
    return target
  }
  return createReactiveObject(
    target,
    false,
    mutableHandlers,
    mutableCollectionHandlers,
    reactiveMap
  )
}

function createReactiveObject(
  target: Target,
  isReadonly: boolean,
  baseHandlers: ProxyHandler<any>,
  collectionHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<Target, any>
) {
	// ...
  const proxy = new Proxy(
    target,
    // 对 Set、Map 的集合使用 collectionHandlers（mutableCollectionHandlers）
    // 普通对象使用 baseHandlers（mutableHandlers）
    targetType === TargetType.COLLECTION ? collectionHandlers : baseHandlers
  )
  // ...
  return proxy
}
```

接下来看下 mutableHandlers

```ts
// packages/reactivity/src/baseHandlers.ts
export const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
  deleteProperty,
  has,
  ownKeys
}
```

看下 get 和 set

```ts
// packages/reactivity/src/baseHandlers.ts
const get = /*#__PURE__*/ createGetter()
// ...
function createGetter(isReadonly = false, shallow = false) {
  return function get(target: Target, key: string | symbol, receiver: object) {
    // ...

    const res = Reflect.get(target, key, receiver)

    if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
      return res
    }

    if (!isReadonly) {
      // 调用 track 建立依赖关系
      track(target, TrackOpTypes.GET, key)
    }

    // ...
    return res
  }
}
```

```ts
// packages/reactivity/src/baseHandlers.ts
const set = /*#__PURE__*/ createSetter()
// ...
function createSetter(shallow = false) {
  return function set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object
  ): boolean {
    let oldValue = (target as any)[key]
    // ...
    const result = Reflect.set(target, key, value, receiver)
    // don't trigger if target is something up in the prototype chain of original
    if (target === toRaw(receiver)) {
      if (!hadKey) {
        // 调用 trigger 通知依赖重新执行
        trigger(target, TriggerOpTypes.ADD, key, value)
      } else if (hasChanged(value, oldValue)) {
        // 调用 trigger 通知依赖重新执行
        trigger(target, TriggerOpTypes.SET, key, value, oldValue)
      }
    }
    return result
  }
}
```

接下来再看下 track

```ts
// packages/reactivity/src/effect.ts
export function track(target: object, type: TrackOpTypes, key: unknown) {
  if (!isTracking()) {
    return
  }
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = createDep()))
  }

  const eventInfo = __DEV__
    ? { effect: activeEffect, target, type, key }
    : undefined

  trackEffects(dep, eventInfo)
}


export function trackEffects(
  dep: Dep,
  debuggerEventExtraInfo?: DebuggerEventExtraInfo
) {
	// ...
  if (shouldTrack) {
    dep.add(activeEffect!)
    activeEffect!.deps.push(dep)
  }
}
```

上半部分与我们自己实现的逻辑很类似，先找出 dep 如果不存在则创建，只不过 Vue 使用的是 Map 和 Set（createDep 返回值为 Set）。

然后是 trackEffects，关键代码就是 dep 和 activeEffect 互相保存，我们的做法只是将 activeEffect  存入 dep 。

接下来看看 set 中调用的 trigger。

```ts
// packages/reactivity/src/effect.ts
export function trigger(
  target: object,
  type: TriggerOpTypes,
  key?: unknown,
  newValue?: unknown,
  oldValue?: unknown,
  oldTarget?: Map<unknown, unknown> | Set<unknown>
) {
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    // never been tracked
    // 没有被 track 收集到，直接返回
    return
  }

  let deps: (Dep | undefined)[] = []
  if (type === TriggerOpTypes.CLEAR) {
    // collection being cleared
    // trigger all effects for target
    // 清空依赖，需要触发与 target 关联的所有 effect
    deps = [...depsMap.values()]
  } else if (key === 'length' && isArray(target)) {
    // 修改数组的 length 时对应的处理
    depsMap.forEach((dep, key) => {
      if (key === 'length' || key >= (newValue as number)) {
        deps.push(dep)
      }
    })
  } else {
    // schedule runs for SET | ADD | DELETE
    // 修改、新增、删除属性时执行
    if (key !== void 0) {
      deps.push(depsMap.get(key))
    }

    // also run for iteration key on ADD | DELETE | Map.SET
    // 往 deps 中添加迭代器属性的 effect
    switch (type) {
      // ...
    }
  }
  
  // 以上操作则是为了取出 deps (targetMap[target][key])

  // 下面的操作则是将 deps 中的 effect 取出并执行
  // 开发时还会传入 eventInfo
  const eventInfo = __DEV__
    ? { target, type, key, newValue, oldValue, oldTarget }
    : undefined

  if (deps.length === 1) {
    if (deps[0]) {
      if (__DEV__) {
        triggerEffects(deps[0], eventInfo)
      } else {
        triggerEffects(deps[0])
      }
    }
  } else {
    const effects: ReactiveEffect[] = []
    for (const dep of deps) {
      if (dep) {
        effects.push(...dep)
      }
    }
    if (__DEV__) {
      triggerEffects(createDep(effects), eventInfo)
    } else {
      triggerEffects(createDep(effects))
    }
  }
}

// 执行 effect
export function triggerEffects(
  dep: Dep | ReactiveEffect[],
  debuggerEventExtraInfo?: DebuggerEventExtraInfo
) {
  // spread into array for stabilization
  for (const effect of isArray(dep) ? dep : [...dep]) {
    if (effect !== activeEffect || effect.allowRecurse) {
      if (__DEV__ && effect.onTrigger) {
        effect.onTrigger(extend({ effect }, debuggerEventExtraInfo))
      }
      if (effect.scheduler) {
        effect.scheduler()
      } else {
        effect.run()
      }
    }
  }
}
```

trigger 函数看似很长，其实可以简化成我们的例子进行理解，无非就是取出对应的 deps ，遍历出 deps 中的 effect 并执行。

接下来就该看看 effect 函数的实现了。

```ts
// packages/reactivity/src/effect.ts
export function effect<T = any>(
  fn: () => T,
  options?: ReactiveEffectOptions
): ReactiveEffectRunner {
  if ((fn as ReactiveEffectRunner).effect) {
    fn = (fn as ReactiveEffectRunner).effect.fn
  }

  // 调用 ReactiveEffect 对进行封装
  const _effect = new ReactiveEffect(fn)
  // ...
  // 判断是否有 options.lazy
  // lazy 为 true 不会立即执行
  if (!options || !options.lazy) {
    _effect.run()
  }
  const runner = _effect.run.bind(_effect) as ReactiveEffectRunner
  runner.effect = _effect
  return runner
}


export class ReactiveEffect<T = any> {
  active = true
  deps: Dep[] = []

  // can be attached after creation
  computed?: boolean
  allowRecurse?: boolean
  onStop?: () => void
  // dev only
  onTrack?: (event: DebuggerEvent) => void
  // dev only
  onTrigger?: (event: DebuggerEvent) => void

  constructor(
    public fn: () => T,
    public scheduler: EffectScheduler | null = null,
    scope?: EffectScope | null
  ) {
    recordEffectScope(this, scope)
  }

  run() {
    if (!this.active) {
      return this.fn()
    }
    if (!effectStack.includes(this)) {
      try {
        // 执行时将当前的 effect 存入 effectStack
        // 并赋值给 activeEffect
        // 在 track 时获取
        effectStack.push((activeEffect = this))
        enableTracking()
        // ...
        return this.fn()
      } finally {
        // ...
        resetTracking()
        effectStack.pop()
        const n = effectStack.length
        // 从 effectStack 继续取出上一个的 activeEffect 继续执行
        activeEffect = n > 0 ? effectStack[n - 1] : undefined
      }
    }
  }

  stop() {
    // ...
  }
}
```

我们在使用 effect 时，会将我们传入的函数经过 ReactiveEffect 封装，如果我们没传入 `{ lazy: true }` 则会立即执行 run 函数。

run 函数就是先赋值 activeEffect 并存入 effectStack，然后执行我们传入的回调函数。

执行回调函数的过程会触发 Proxy 的 get，get 又会触发 track 进行依赖收集。

执行完成后将 activeEffect 从 effectStack pop出去，并取出上一个 activeEffect 继续执行。

> 为什么要用 effectStack ？
>
> 假如我们在 effect 中使用了 computed，Vue 需要先执行计算出 computed。
>
> computed 内部也会调用 ReactiveEffect，所以需要将 computed 的 effect 存入 effectStack ，当 computed 计算完成之后，则从 effectStack pop 出去，继续执行我们的 effect。

如此便完成依赖收集，当响应式数据发生变化时则会触发 trigger，重新执行我们在 effect  中传入的回调函数。



修改响应式数据为什么页面会自动更新？还记得上篇文章[<深入 Vue3 源码，学习初始化流程>](http://mp.weixin.qq.com/s?__biz=MzIyMDQyNTc3OA==&mid=2247484491&idx=1&sn=9b2593682bcf60705bfb16c583b2e287&chksm=97cd7f16a0baf60055af324f620be850fb1a461b121aab323c550a3be9a5a97301666f0661f1&token=1169695290&lang=zh_CN#rd)介绍的 `setupRenderEffect` 吗？

这个方法也是利用了 ReactiveEffect，在 mount 的时候会触发 `setupRenderEffect` 执行进而触发 `patch` 。 `patch` 的过程中会使用响应式数据，从而建立依赖关系，当响应式数据发生变化时会重新执行 `setupRenderEffect`，后面就进入 diff 了，下篇文章在详细展开 diff。

## 结语

以上便是 Vue3 的响应式原理，只要了解了原理，能用自己的语言清晰的描述出来，面试肯定能增加成功率。

好了，这篇文章就水到这里吧。如有错误的地方，希望还能在评论区指出，感谢！

下篇文章将解析 Vue3 的 diff 算法，如果有兴趣的话别忘了关注我呀，我们一起学习、进步。



