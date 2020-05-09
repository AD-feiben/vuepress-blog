---
title: 开源了一个图表库 lw-chart
date: 2020-05-09
categories:
 - 前端
tags:
 - canvas
 - lw-chart
---

前段时间遇到一个需求，需要画一个 7日年化利率 的曲线图。

UI 提了几个需求，说实话，一开始看到时都懵逼了，然后我回了句 “你说，我不一定实现。”

一开始看了网上的一些开源图表，看是能实现，但是又觉得比较重，没必要为了一个图表而引入整个库。而后下定决心自己撸一个。

<!-- more -->

当然了一开始并不打算写一个 npm 库，只是在项目中写一个 js 来实现图表绘制。在效果实现之后觉得需要整理一番，于是在五一期间进行了重构，将结构整清楚，提高扩展性，以便应对日后不同的需求。

先来看看 [demo](https://ad-feiben.github.io/lw-chart-docs/docs/demo)

## 为什么叫 lw-chart

当然了 lw 不是我名字的缩写，lw 是指 lightweight 轻量的意思，我希望这 lw-chart 能够真正做到轻量化，当我只使用其中某一个类型的图表时，那么只需要引入这个类型的图表，其他的不相关的代码不要来增加项目的体积。

**lw-chart 是如何做的呢？**

lw-chart 内部通过类继承的方式提高代码的复用性，同时在编译打包时，输出多个文件，当实际项目中使用了其中某一个类型的图表，那么可以再项目中只 `import` 一个文件，避免把所有类型的图表都都入到项目中而不使用的情况。

具体的使用方式可以查看[文档](https://ad-feiben.github.io/lw-chart-docs/docs)，这里就不在赘述。


## 踩过的坑

### 布局

在开始编码前一定要先考虑好布局，不然在写代码时会很混乱，不知道坐标该加还是该减。

第一次写的时候，因为参考了网上的代码，导致没有清晰的布局，虽然能绘制出一些东西，但是遇到要计算坐标时，就会很混乱，导致就都无法达到预期的效果。

最后自己画了一个布局的图，再开始编码。下面是我的一个布局结构

![lw-chart](https://imgkr.cn-bj.ufileos.com/67d85d47-3aca-421c-aa86-04acdb6d3c96.png)


我分了两个类来实现这个布局，一个是基类 `LWChart`，定义了 `canvas`，`titleBar`，`chart`。

而 x坐标 和 y坐标 则定义在 `Axis` 坐标轴类中，因为有些图表可能不需要坐标轴，所以通过 `Axis` 继承 `LWChart` 达到更灵活的配置。


### 高清屏下变模糊的处理

获取屏幕 dpi，尺寸及位置参数在绘制时乘以 `dpi`。

`dpi` 的计算方式如下:

```js
let n = (ctx.backingStorePixelRatio ||
ctx.webkitBackingStorePixelRatio ||
ctx.mozBackingStorePixelRatio ||
ctx.msBackingStorePixelRatio ||
ctx.oBackingStorePixelRatio ||
ctx.backingStorePixelRatio ||
1);

let a = (window.devicePixelRatio || 1) / n;
if (a < 1) {
  a = 1;
}

const dpi = a / n;
```

### 获取贝塞尔曲线控制点

可能大部分都是使用现成的图表库，网上比较少关于贝塞尔曲线控制点计算的文章。

```ts
/** 给原始坐标点添加三次贝塞尔曲线控制点 */
export const getCurveList = function (pointList: IPos[]): ICurvePoint[] {
  if (pointList.length <= 0) return [];
  // 长度比例系数
  const lenParam = 1 / 3;
  const len = pointList.length;
  return pointList.map((curPoint, index) => {
    const nextPoint = index === len - 1 ? curPoint : pointList[index + 1];
    const curX = curPoint.x;
    const curY = curPoint.y;
    const nextX = nextPoint.x;
    const nextY = nextPoint.y;
    const deltaX = Math.abs(nextX - curX)  * lenParam;
    return {
      start: curPoint,
      end: nextPoint,
      control1: {
        x: curX + deltaX,
        y: curY
      },
      control2: {
        x: nextX - deltaX,
        y: nextY
      }
    };
  });
};
```

以上是我的计算方式，主要通过前后两个点的 x坐标 进行加减生成两个控制点，使得贝塞尔曲线相对平滑。

## 动画处理

动画主要通过 `requestAnimationFrame` api 进行实现。

将需要绘制的数据存入一个数组中，将数组中的前 n - 1 个数据使用 `bezierCurveTo` 绘制，最后一段曲线使用贝塞尔曲线函数进行绘制

```ts
// 动画执行中，使用贝塞尔函数绘制最后一段曲线
for (let t = 0; t <= percent / 100; t += 0.1) {
  lastX = curveWithTime(lastPoint.start.x, lastPoint.control1.x, lastPoint.control2.x, lastPoint.end.x, t);
  lastY = curveWithTime(lastPoint.start.y, lastPoint.control1.y, lastPoint.control2.y, lastPoint.end.y, t);
  this.ctx.lineTo(lastX, lastY);
}
```

使用 `ctx.lineTo` 绘制出来的为直线，所以需要小间隙绘制多个点才能使得曲线相对平滑。


### 动画时间计算

首先通过计算每段曲线应该执行的时间，
结合 `requestAnimationFrame` 和 `performance.now();` 获取每一帧的时间差，通过时间差与每一段曲线的单位时间进行对比，计算出百分比，再通过上面的 `for` 循环进行绘制。


## 拓展

目前 lw-chart 中实现的图表绘制的只有 `Area`，可以通过参数配置控制显示线条或区域。但是这也许还是还是不够好用，也不可能满足到各个需求。

所以各位开发者可以在 lw-chart 的基础上进行定制开发，通过继承 `LWChart` 或者 `Axis` 这个类。

关于如何开发，后期整理后会在[文档](https://ad-feiben.github.io/lw-chart-docs/docs)上更新。


欢迎各位大佬 pull request，一同开发。

---

如果觉得 lw-chart 不错的话，不妨下载体验一番，顺便到 Github 点个 Star。


如果觉得内容还不错的话，希望小伙伴可以帮忙点赞转发，给更多的同学看到，感谢感谢！


如果你喜欢我的文章，还可以关注我的公众号【前端develop】

![前端develop](https://user-gold-cdn.xitu.io/2019/10/25/16dfee2bb6ff8f91?w=900&h=500&f=png&s=68014)