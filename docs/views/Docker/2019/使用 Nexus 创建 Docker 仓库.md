---
title: 使用 Nexus 创建 Docker 仓库
date: 2019-10-20
categories:
 - Docker
tags:
 - Docker
 - Nexus
---

使用 Docker 官方的 Registry 创建的仓库，面临着这样的问题，比如删除镜像后空间默认不会回收，造成空间被占用。比较常见的做法是使用 Nexus 来管理企业的工具包。

Nexus 不仅可以创建 Docker 仓库，也可以 NPM、Maven 等多种类型的仓库。

## 启动 Nexus 容器

```bash
$ docker run -d --name nexus3 --restart=always \
    -p 8081:8081 \
    -p 8082:8082 \
    --mount src=nexus-data,target=/nexus-data \
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

**其中 8081 为 Nexus 的访问端口，8082 为仓库的端口**，网上大部分文章并没有加上 8082 端口的映射，导致我在测试的时候卡了很久。

稍等一两分钟，浏览器打开 `domain:8081`。

点击右上角 `Sign in` 进行登录，初始账号为 `admin`，密码可以通过 `exec` 命令进入容器内，根据提示的路径查看初始密码。

![登录页](/imgs/docker/4.png)

进入容器查看初始密码

```sh
$ docker exec -it f637 /bin/bash
bash-4.4$ vi /nexus-data/admin.password
```

登陆后会被要求修改密码，以后将使用这密码。

## 创建仓库

点击导航的齿轮按钮进入设置页面，进入 `Repository->Repositories` 点击 `Create repository` 选择 `docker (hosted)`

`docker (hosted)` 为本地仓库，`docker (proxy)` 为代理仓库，`docker (group)` 为聚合仓库，本文只介绍本地仓库，如果有兴趣也可以到网上查找另外两种仓库的用法。

![创建仓库](/imgs/docker/5.png)

只需要填好上图中红框的部分即可，其中 `Name` 为仓库名，`HTTP` 的输入框则是填写端口号 8082，写好之后滑到页面底部，点击 `Create repository` 即创建仓库。

## 添加访问权限

菜单 Security->Realms 把 Docker Bearer Token Realm 移到右边的框中保存。

添加用户规则：菜单 Security->Roles->Create role 在 Privlleges 选项搜索 docker 把相应的规则移动到右边的框中然后保存。

添加用户：菜单 Security->Users->Create local user 在 Roles 选项中选中刚才创建的规则移动到右边的窗口保存。


## 登录仓库

因为是创建的仓库是用 HTTP 的方式访问的，所以在登录前需要修改 Docker 配置中的 Daemon

`{ "insecure-registries": ["domain:8082"] }`


```sh
$ docker login domain:8082
Username: yourName
Password:
Login Succeeded
```

上传仓库、下载仓库、搜索仓库 这些内容与上一篇文章中的一致，这里就不再赘述了。

**其中需要注意的点为启动 Nexus 时，需要把仓库的端口一起映射到宿主机中。**