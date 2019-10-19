---
title: 记 Nuxt 开发遇到 OOM
date: 2018-10-6
categories:
 - 前端
tags:
 - Vue
 - Nuxt
---

## 起因

最近在给自己的[博客](http://feiben.xyz)重新开发，因为 [V1](http://feiben.xyz/v1/)  使用 Nuxt 框架进行开发，所以新版也采用 Nuxt 来开发。发开到接近完成的时候，项目怎么都启动不了。看了下报错信息，显示的是 node 在编译的时候内存溢出了。

## 定位问题

到 Nuxt 项目 Issues 看下有没有相同的问题，发现有人给 Node 运行时指定内存空间 `node --max-old-space-size=4096 app` 。但是我总觉得我不是这样的问题，第一，我的页面并不算多，而且运行的 js 代码也不多；第二，在开始的时候我都是可以启动的，增加了一两个页面之后就触发 OOM 了。后面我在网上看到一片文章描述的是 css 代码过多的嵌套也会触发 OOM，于是我把重点定位到 css 代码中，但是我看了下也没有过多的嵌套。最后我删了几个页面，把项目跑起来，在浏览器中看到了一份 less 代码重复加载了好几遍，这才让我恍然大悟。less 代码如下

```less
.helps(200);
.helps(@n, @i: 0) when (@i =< @n) {
  @px: (1px * @i);
  .p-@{i}{padding: @px;}
  .pt-@{i}{padding-top: @px;}
  .pr-@{i}{padding-right: @px;}
  .pb-@{i}{padding-bottom: @px;}
  .pl-@{i}{padding-left: @px;}
  .pv-@{i}{
    padding-top: @px;
    padding-bottom: @px;
  }
  .ph-@{i}{
    padding-left: @px;
    padding-right: @px;
  }

  .m-@{i}{margin: @px;}
  .mt-@{i}{margin-top: @px;}
  .mr-@{i}{margin-right: @px;}
  .mb-@{i}{margin-bottom: @px;}
  .ml-@{i}{margin-left: @px;}
  .mv-@{i}{
    margin-top: @px;
    margin-bottom: @px;
  }
  .mh-@{i}{
    margin-left: @px;
    margin-right: @px;
  }
  .helps(@n, @i + 1);
}
```

因为在多个页面中 import 了这个样式文件，css-loader 处理的时候导致了内存溢出。

## 解决问题

在每个页面中删除重复导入的样式代码就解决了 OOM 的问题。这是我第一次在开发中遇到 OOM，一开始有点不知所措，差点就要放弃 V2 的开发:laughing:，慢慢分析还是可以解决问题，希望这篇文章能给您提供帮助。
