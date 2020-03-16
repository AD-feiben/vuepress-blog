---
title: 【面试题解析】从 Vue 源码分析 key 的作用
date: 2020-03-15
categories:
 - 前端
tags:
 - Vue
 - Diff
 - 面试题
---


最近看了面试题中有一个这样的题，`v-for 为什么要绑定 key？`

Vue 中 key 很多人都弄不清楚有什么作用，甚至还有些人认为不绑定 key 就会报错。

其实没绑定 key 的话，Vue 还是可以正常运行的，报警告是因为没通过 Eslint 的检查。

接下来将通过源码一步步分析这个 key 的作用。

## Virtual DOM

Virtual DOM 最主要保留了 DOM 元素的层级关系和一些基本属性，本质上就是一个 JS 对象。相对于真实的 DOM，Virtual DOM 更简单，操作起来速度更快。

如果需要改变 DOM，则会通过新旧 Virtual DOM 对比，找出需要修改的节点进行真实的 DOM 操作，从而减小性能消耗。

## Diff

传统的 Diff 算法需要遍历一个树的每个节点，与另一棵树的每个节点对比，时间复杂度为 O(n²)。

Vue 采用的 Diff 算法则通过逐级对比，大大降低了复杂性，时间复杂度为 O(n)。

## VNode 更新过程

VNode 更新首先会经过 **patch** 函数，**patch** 函数源码如下：

```js
/* vue/src/core/vdom/patch.js */
function patch (oldVnode, vnode, hydrating, removeOnly) {
  if (isUndef(vnode)) {
    if (isDef(oldVnode)) invokeDestroyHook(oldVnode)
    return
  }

  let isInitialPatch = false
  const insertedVnodeQueue = []

  if (isUndef(oldVnode)) {
    // empty mount (likely as component), create new root element
    isInitialPatch = true
    createElm(vnode, insertedVnodeQueue)
  } else {
    const isRealElement = isDef(oldVnode.nodeType)
    if (!isRealElement && sameVnode(oldVnode, vnode)) {
      // patch existing root node
      patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly)
    } else {
      // somecode
    }
  }

  invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch)
  return vnode.elm
}
```
vnode 表示更新后的节点，oldVnode 表示更新前的节点，通过对比新旧节点进行操作。

1、vnode 未定义，oldVnode 存在则触发 destroy 的钩子函数

2、oldVnode 未定义，则根据 vnode 创建新的元素

3、oldVnode 不为真实元素并且 oldVnode 与 vnode 为同一节点，则会调用 patchVnode 触发更新

4、oldVnode 为真实元素或者 oldVnode 与 vnode 不是同一节点，另做处理


接下来会进入 **patchVnode** 函数，源码如下：

```js
function patchVnode (
  oldVnode,
  vnode,
  insertedVnodeQueue,
  ownerArray,
  index,
  removeOnly
) {
  if (oldVnode === vnode) {
    return
  }

  if (isDef(vnode.elm) && isDef(ownerArray)) {
    // clone reused vnode
    vnode = ownerArray[index] = cloneVNode(vnode)
  }

  // somecode

  const oldCh = oldVnode.children
  const ch = vnode.children

  // somecode

  if (isUndef(vnode.text)) {
    if (isDef(oldCh) && isDef(ch)) {
      if (oldCh !== ch) updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly)
    } else if (isDef(ch)) {
      if (process.env.NODE_ENV !== 'production') {
        checkDuplicateKeys(ch)
      }
      if (isDef(oldVnode.text)) nodeOps.setTextContent(elm, '')
      addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue)
    } else if (isDef(oldCh)) {
      removeVnodes(oldCh, 0, oldCh.length - 1)
    } else if (isDef(oldVnode.text)) {
      nodeOps.setTextContent(elm, '')
    }
  } else if (oldVnode.text !== vnode.text) {
    nodeOps.setTextContent(elm, vnode.text)
  }
  if (isDef(data)) {
    if (isDef(i = data.hook) && isDef(i = i.postpatch)) i(oldVnode, vnode)
  }
}
```

1、vnode 的 text 不存在，则会比对 oldVnode 与 vnode 的 children 节点进行更新操作

2、vnode 的 text 存在，则会修改 DOM 节点的 text

接下来在 **updateChildren** 函数内就可以看到 key 的用处。


## key 的作用

key 的作用主要是给 VNode 添加唯一标识，通过这个 key，可以更快找到新旧 VNode 的变化，从而进一步操作。

key 的作用主要表现在以下这段源码中。

```js
/* vue/src/core/vdom/patch.js */
function updateChildren (parentElm, oldCh, newCh, insertedVnodeQueue, removeOnly) {
  let oldStartIdx = 0
  let newStartIdx = 0
  let oldEndIdx = oldCh.length - 1
  let oldStartVnode = oldCh[0]
  let oldEndVnode = oldCh[oldEndIdx]
  let newEndIdx = newCh.length - 1
  let newStartVnode = newCh[0]
  let newEndVnode = newCh[newEndIdx]
  let oldKeyToIdx, idxInOld, vnodeToMove, refElm

  // removeOnly is a special flag used only by <transition-group>
  // to ensure removed elements stay in correct relative positions
  // during leaving transitions
  const canMove = !removeOnly

  if (process.env.NODE_ENV !== 'production') {
    checkDuplicateKeys(newCh)
  }

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (isUndef(oldStartVnode)) {
      oldStartVnode = oldCh[++oldStartIdx] // Vnode has been moved left
    } else if (isUndef(oldEndVnode)) {
      oldEndVnode = oldCh[--oldEndIdx]
    } else if (sameVnode(oldStartVnode, newStartVnode)) {
      patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx)
      oldStartVnode = oldCh[++oldStartIdx]
      newStartVnode = newCh[++newStartIdx]
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx)
      oldEndVnode = oldCh[--oldEndIdx]
      newEndVnode = newCh[--newEndIdx]
    } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
      patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx)
      canMove && nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm))
      oldStartVnode = oldCh[++oldStartIdx]
      newEndVnode = newCh[--newEndIdx]
    } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
      patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx)
      canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm)
      oldEndVnode = oldCh[--oldEndIdx]
      newStartVnode = newCh[++newStartIdx]
    } else {
      // 以上 4 种均匹配不到，通过 key 生成 key -> index 的 map（生成一次）
      if (isUndef(oldKeyToIdx)) oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)
      /**
       * 有 key 通过 key 比较，时间复杂度 O(n)
       * 无 key 时，每个 vnode 均需要遍历比较，时间复杂度  O(n²)
       */
      idxInOld = isDef(newStartVnode.key)
        ? oldKeyToIdx[newStartVnode.key]
        : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx)
      if (isUndef(idxInOld)) { // New element
        createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx)
      } else {
        vnodeToMove = oldCh[idxInOld]
        if (sameVnode(vnodeToMove, newStartVnode)) {
          patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue, newCh, newStartIdx)
          oldCh[idxInOld] = undefined
          canMove && nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm)
        } else {
          // same key but different element. treat as new element
          createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx)
        }
      }
      newStartVnode = newCh[++newStartIdx]
    }
  }
  if (oldStartIdx > oldEndIdx) {
    refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm
    addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue)
  } else if (newStartIdx > newEndIdx) {
    removeVnodes(oldCh, oldStartIdx, oldEndIdx)
  }
}
```

updateChildren 过程为：

1、分别用两个指针（startIndex, endIndex）表示 oldCh 和 newCh 的头尾节点

2、对指针所对应的节点做一个两两比较，判断是否属于同一节点

3、如果4种比较都没有匹配，那么判断是否有 key，有 key 就会用 key 去做一个比较；无 key 则会通过遍历的形式进行比较

4、比较的过程中，指针往中间靠，当有一个 startIndex > endIndex，则表示有一个已经遍历完了，比较结束


## 总结

从 VNode 的渲染过程可以得知，Vue 的 Diff 算法先进行的是同级比较，然后再比较子节点。

子节点比较会通过 startIndex、endIndex 两个指针进行两两比较，再通过 key 比对子节点。如果没设置 key，则会通过遍历的方式匹配节点，增加性能消耗。

所以不绑定 key 并不会有问题，绑定 key 之后在性能上有一定的提升。

综上，key 主要是应用在 Diff 算法中，作用是为了更快速定位出相同的新旧节点，尽量减少 DOM 的创建和销毁的操作。

希望以上内容能够对各位小伙伴有所帮助，祝大家面试顺利。

## 补充（2020/03/16）

Vue 的文档中对 key 的说明如下：

> key 的特殊属性主要用在 Vue 的虚拟 DOM 算法，在新旧 nodes 对比时辨识 VNodes。如果不使用 key，Vue 会使用一种最大限度减少动态元素并且尽可能的尝试就地修改/复用相同类型元素的算法。而使用 key 时，它会基于 key 的变化重新排列元素顺序，并且会移除 key 不存在的元素。

关于就地修改，关键在于 sameVnode 的实现，源码如下：

```js
function sameVnode (a, b) {
  return (
    a.key === b.key && (
      (
        a.tag === b.tag &&
        a.isComment === b.isComment &&
        isDef(a.data) === isDef(b.data) &&
        sameInputType(a, b)
      ) || (
        isTrue(a.isAsyncPlaceholder) &&
        a.asyncFactory === b.asyncFactory &&
        isUndef(b.asyncFactory.error)
      )
    )
  )
}
```

可以看出，当 key 未绑定时，主要通过元素的标签等进行判断，在 updateChildren 内会将 oldStartVnode 与 newStartVnode 判断为同一节点。

如果 VNode 中只包含了文本节点，在 patchVnode 中可以直接替换文本节点，而不需要移动节点的位置，确实在不绑定 key 的情况下效率要高一丢丢。

**某些情况下不绑定 key 的效率更高，那为什么官方还是推荐绑定 key 呢？**

因为在实际项目中，大多数情况下 v-for 的节点内并不只有文本节点，那么 VNode 的字节点就要进行销毁和创建的操作。

相比替换文本带来的一丢丢提升，这部分会消耗更多的性能，得不偿失。


了解了就地修改，那么我们在一些简单节点上可以选择不绑定 key，从而提高性能。

---

如果还有其他疑问，欢迎大家扫码关注我的公众号【前端develop】给我留言。

![前端develop](/imgs/qrcode.png)
