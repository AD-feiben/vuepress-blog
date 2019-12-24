---
title: 10 分钟搭建私服 NPM
date: 2019-12-24
categories:
 - 前端
tags:
 - NPM
 - Docker
 - Nexus
---

最近因为公司项目需要搭建一个私服 npm，安排我来研究，这两天也踩了不少坑，于是记录下踩坑经历，避免小伙伴们踩坑。

<!-- more -->

## 私服 npm 能做什么？

如果一个公司的项目非常多，而且有很多的方法、组件、api都是可以共用的。如果没有私服 npm，那么我们将不断的复制粘贴这些代码到各个项目中，一旦其中的某一处需要修改，那么所有的项目都需要改一遍。

更好地维护这些公共代码，比较好的处理方式是将这些公共代码封装成一个个 npm 包，但是我们又不能将公司的代码发布到外网的 npm 中，所以私服 npm 就能够很好地帮助我们解决这一问题。


## 安装 Nexus

由于之前学习 docker 的时候安装了 Nexus，小伙伴们可以参考之前的文章 [使用 Nexus 创建 Docker 仓库](https://mp.weixin.qq.com/s/P8625h1nh6Zd-viRRSqrNg)，这里不再过多赘述。


```shell
$ docker run -d --name nexus3 --restart=always \
    -p 8081:8081 \
    -p 8082:8082 \
    -v nexus-data:/nexus-data \
    sonatype/nexus3
Unable to find image 'sonatype/nexus3:latest' locally
latest: Pulling from sonatype/nexus3
c65691897a4d: Pull complete
641d7cc5cbc4: Pull complete
c508b13320cd: Pull complete
79e3bf9d3132: Pull complete
Digest: sha256:2c33632ccd8f8c5f9023a3d7f5f541e271833e402219f8c5a83a29d1721457ca
Status: Downloaded newer image for sonatype/nexus3:latest
f637e039214978f8aac41e621e51588bd8cd8438055498c4060fbaf87799e64f
```

如果你已经安装了 docker，可以使用上面的命令安装并启动 Nexus 服务。否则需要到官网 https://www.sonatype.com/download-oss-sonatype 下载 Nexus。因为使用 docker 更加方便快捷，这里更推荐使用 docker 的方式启动 Nexus 服务。

命令执行完后，用浏览器打开 `http://localhost:8081` 即可看到 Nexus 的管理页面。点击右上角 `Sign In` 登录，管理员账号 `admin`，初始密码可以根据提示进入容器内查看。

```shell
$ docker exec -it f637 /bin/bash
bash-4.4$ vi /nexus-data/admin.password
```

其中 f637 为容器 id，需要根据启动 nexus 的容器 id 进行修改。


## 创建 npm 仓库

打开`设置 -> repositories` 页面，点击 `Create repository` 按钮。

![Create repository](/imgs/前端/4.png)

### 先创建 `npm(proxy)` 仓库，即代理仓库

填入仓库名以及代理地址，代理地址可使用 npm 官方镜像地址 https://registry.npmjs.org

![npm(proxy)](/imgs/前端/5.png)

完成后点击底部 `Creaete repository` 完成创建。

### 创建 `npm(hosted)` 仓库，即私服仓库

![npm(hosted)](/imgs/前端/6.png)

输入仓库名即可点击底部 `Creaete repository` 完成创建。

### 创建 `npm(group)` 仓库，npm 组

为什么要使用 `npm(group)` ？

当我们从 `npm(group)` 这个仓库安装 npm 包时，首先会查看该仓库中是否存在，不存在时则会使用代理仓库到官方仓库进行下载。

![npm(group)](/imgs/前端/7.png)

创建 `npm(group)` 需要填写仓库名，然后将 `npm(proxy)` 和 `proxy(hosted)` 设置为成员即可，点击底部 `Creaete repository` 完成创建。

## 验证私服 npm

```shell
$ npm install vue --registry=http://localhost:8081/repository/npm-group/
npm ERR! code E401
npm ERR! 401 Unauthorized: vue@latest

npm ERR! A complete log of this run can be found in:
npm ERR!     /Users/admin/.npm/_logs/2019-12-24T08_33_14_088Z-debug.log
```

可以看到出现了 401 未授权的错误，因为我们的 npm 没有登录私服。

原有的 npm 是可以不登录进行安装 npm 包的，所以我们的私服也需要改成允许匿名访问的。

**打开设置页面 `Security -> Anonymous`，勾选 `Allow anonymous users to access the server` 即可，点击 `save` 保存。**（网上的文章基本都跳过该步骤）

```shell
$ npm install vue --registry=http://localhost:8081/repository/npm-group/
npm notice created a lockfile as package-lock.json. You should commit this file.
npm WARN npm-test@1.0.0 No description
npm WARN npm-test@1.0.0 No repository field.

+ vue@2.6.11
added 1 package from 1 contributor in 2.944s
```

可以看到这次就安装成功了。

但是每次都需要指定 `--registry` 也太麻烦了，我们可以使用 `npm config set registry http://localhost:8081/repository/npm-group/`, 将 npm 默认的镜像改成我们私服的镜像。这样我们就不需要每次都指定镜像源了。

直接修改默认的镜像源也不够方便，因为发包的时候使用的镜像源是 `http://localhost:8081/repository/npm-hosted/`。最好的方式是写一个自己的 `cnpm`。

因此我写了一个为私服 npm 使用工具 `fnpm` 在 github，小伙伴们可以到 https://github.com/AD-feiben/fnpm 上克隆。在使用上与 `npm` 一样，但是会从私服上拉取 npm 包，发布包也只会发布到私服中。

## 使用 fnmp

首先将 fnpm 克隆到本地

```git
$ git clone git@github.com:AD-feiben/fnpm.git
```

根据私服 npm 地址修改 `lib/config.js` 中 `fnpmRegistry`、`fnpmHostedRegistry` 对应的地址即可。

将 fnpm 发布到私服，参考下文使用 npm 命令发布包。

使用 `npm install fnpm --registry=http://localhost:8081/repository/npm-group/ -g` 下载 fnpm。

接下就可以使用 fnpm 了。


## 发布 npm 包到私服

首先登录私服 npm

```shell
$ npm login --registry=http://localhost:8081/repository/npm-hosted/

# or
# 如果安装了 fnpm
$ fnpm login
```

使用 `publish` 命令发布

```shell
$ npm publish --registry=http://localhost:8081/repository/npm-hosted/

# or
# 如果安装了 fnpm
$ fnpm publish
```

如果文中有说的不对的地方，欢迎留言指出改正，也欢迎留言讨论。

---

如果还有其他疑问，欢迎大家扫码关注我的公众号【前端develop】给我留言。

![前端develop](/imgs/qrcode.png)