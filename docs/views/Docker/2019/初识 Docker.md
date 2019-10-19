---
title: 初识 Docker
date: 2019-10-04
categories:
 - Docker
tags:
 - Docker
---

![docker](/imgs/docker/0.png)

其实这篇文章在一年多前就起好名字了，因为之前自己对 Docker 的镜像，容器等概念比较混淆，所以一直都没有写。由于最近重新看了 Docker 的内容，也将 Docker 应用到自己写的 Python 项目 [https://github.com/AD-feiben/qc-remind](https://github.com/AD-feiben/qc-remind) 中，将该 Python 项目制作成一个 Docker 镜像，在使用起来非常方便，所以用这篇文章记录一下 Docker 的一些知识点，同时分享给大家。关于如何制作镜像也会在以后的文章中讲到。

这篇文章不会讲述以下问题，什么是 Docker、Docker 的历史、Docker 通过什么技术实现、以及为什么要使用 Docker。这里就不在搬运了网上的文章了，直接上手学习 Docker。

- 如果对上面所讲的问题感兴趣的话，可以访问 [https://yeasy.gitbooks.io/docker_practice/](https://yeasy.gitbooks.io/docker_practice/) 进行学习

## 一、安装

因为我的是 Mac，这里只讲 Mac 的安装，其他系统的安装可以参考 [https://yeasy.gitbooks.io/docker_practice/install/](https://yeasy.gitbooks.io/docker_practice/install/)

### 1.1 使用 Homebrew 安装

```shell
$ brew cask install docker
```

使用 `brew cask` 安装即可

### 1.2 手动下载安装

1. 首先在 Docker 官网 [https://www.docker.com](https://www.docker.com/) 注册一个账号，登录账号

2. 进入 [https://hub.docker.com/?overlay=onboarding](https://hub.docker.com/?overlay=onboarding) 下载安装即可

![下载 ](/imgs/docker/1.png)

下载完成之后双击 .dmg 文件，将应用拖到 Application 文件夹中即可。安装完成后，在状态栏就可以看到 Docker 的 logo，说明安装成功。可以通过 `docker --version` 命令查看 Docker 的版本。

```shell
$ docker --version
Docker version 19.03.2, build 6a30dfc
```

## 二、Docker 的一些概念

![Docker 的一些概念](/imgs/docker/2.png)

镜像存放在镜像仓库中，Docker 官方也提供了镜像仓库 [https://hub.docker.com/](https://hub.docker.com/) ，我们可以从这里下载我们所需要的镜像，当然也可以将我们制作好的镜像存放到仓库中。当我们下载好镜像之后，我们可以通过 `run` 命令来创建对应的容器，一个镜像可以创建多个容器，每个容器，相互之间不会产生影响。

### 2.1 image 镜像

以下镜像的操作均以 Nginx 镜像为例

#### 2.1.1 搜索镜像

```shell
$ docker search nginx
NAME                              DESCRIPTION                                     STARS               OFFICIAL            AUTOMATED
nginx                             Official build of Nginx.                        12022               [OK]
jwilder/nginx-proxy               Automated Nginx reverse proxy for docker con…   1669                                    [OK]
richarvey/nginx-php-fpm           Container running Nginx + PHP-FPM capable of…   742                                     [OK]
linuxserver/nginx                 An Nginx container, brought to you by LinuxS…   77
bitnami/nginx                     Bitnami nginx Docker Image                      71                                      [OK]
tiangolo/nginx-rtmp               Docker image with Nginx using the nginx-rtmp…   55                                      [OK]
nginxdemos/hello                  NGINX webserver that serves a simple page co…   28                                      [OK]
jlesage/nginx-proxy-manager       Docker container for Nginx Proxy Manager        24                                      [OK]
jc21/nginx-proxy-manager          Docker container for managing Nginx proxy ho…   23
nginx/nginx-ingress               NGINX Ingress Controller for Kubernetes         22
```

可以看到 `镜像名    镜像描述    点赞数    是否为官方镜像    是否为自动生成`

#### 2.1.2 下载镜像

利用 `docker pull 镜像名[:版本]` 下载我们需要的镜像，不输入版本号默认为 `latest`

```shell
$ docker pull nginx
Using default tag: latest
latest: Pulling from library/nginx
b8f262c62ec6: Pull complete
e9218e8f93b1: Pull complete
7acba7289aa3: Pull complete
Digest: sha256:aeded0f2a861747f43a01cf1018cf9efe2bdd02afd57d2b11fcc7fcadc16ccd1
Status: Downloaded newer image for nginx:latest
docker.io/library/nginx:latest
```

#### 2.1.3 列出本地镜像

可以使用 `docker image ls` 或者 `docker images` 来列出本地存在的镜像

```shell
$ docker images
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
nginx               latest              f949e7d76d63        8 days ago          126MB
centos              latest              67fa590cfc1c        6 weeks ago         202MB
```

其中 `REPOSITORY` 为镜像名；`TAG` 为镜像标签；`IMAGE ID` 为镜像id；`CREATED` 为镜像创建时间；`SIZE` 为镜像大小，该大小为解压缩后的大小，一般比仓库中的现实的镜像大小（压缩后的大小，便于传输）要大一些。

#### 2.1.4 删除镜像

通过 `docker image rm 镜像名/镜像id` 或者 `docker rmi 镜像名/镜像id` 来删除指定的镜像

- 删除镜像时，需要该镜像没有被使用，否则将会看到类似下面的错误提示

```shell
$ docker rmi nginx
Error response from daemon: conflict: unable to remove repository reference "nginx" (must force) - container b36481b353d3 is using its referenced image f949e7d76d63
```

在 Docker 仓库中还有很多优秀的镜像，例如 Ubuntu、CentOS、MySQL 等，大家可以自行查找。

### 2.2 container 容器

#### 2.2.1创建容器

我们可以使用 `docker run [选项] 镜像` 来创建一个容器，如果镜像在本地不存在，则会先到镜像仓库下载该镜像。下面的例子是 nginx 镜像不存在的情况。

```shell
$ docker run -p 8080:80 nginx
Unable to find image 'nginx:latest' locally
latest: Pulling from library/nginx
b8f262c62ec6: Pull complete
e9218e8f93b1: Pull complete
7acba7289aa3: Pull complete
Digest: sha256:aeded0f2a861747f43a01cf1018cf9efe2bdd02afd57d2b11fcc7fcadc16ccd1
Status: Downloaded newer image for nginx:latest
# 终端处于监听容器日志的状态
```

- `-p` 参数将容器中的 `80` 端口映射到宿主机中的 `8080` 端口

在浏览器打开 `localhost:8080` 就可以看到熟悉的 nginx 欢迎页面了。退出容器可以使用 `Ctrl + C`

![Nginx 欢迎页](/imgs/docker/3.png)

#### 2.2.2 查看运行中的容器

我们可以使用 `docker ps` 或者 `docker container ls` 查看运行中的容器。

> 上一步骤通过 `Ctrl + C`  停止了容器

```shell
$ docker ps
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS               NAMES
```

可以看到并没有运行中的容器，我们可以加上 `-a`  显示所有容器，包括停止状态的容器

```shell
$ docker ps -a
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS                     PORTS               NAMES
a2d6842faeb5        nginx               "nginx -g 'daemon of…"   2 hours ago         Exited (0) 2 minutes ago                       crazy_northcutt
```

加上 `-a` 后我们就可以看到已经处于停止状态的容器。

下一步通过下面命令启动一个新的容器

```shell
$ docker run -dit -p 8080:80 nginx
b36481b353d30976171cf7c706f4ce4890f81ee1a81c7e526799fb12198e7f23
```

- `-dit` 参数也可以分开写为 `-d -i -t`

- `-d` 参数表示容器在后台运行，并不会像上个例子处于监听容器日志的状态

- `-i` 参数表示让容器的标准输入保持打开

- `-t` 参数表示让 Docker 分配一个伪终端

可以看到这次的结果并不像 `docker run -p 8080:80 nginx` 那样，返回一个容器id后。终端又恢复到正常状态。

```shell
$ docker ps -a
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS                      PORTS                  NAMES
b36481b353d3        nginx               "nginx -g 'daemon of…"   10 minutes ago      Up 10 minutes               0.0.0.0:8080->80/tcp   recursing_khayyam
a2d6842faeb5        nginx               "nginx -g 'daemon of…"   2 hours ago         Exited (0) 15 minutes ago                          crazy_northcutt
```

通过 `docker ps -a` 命令可以看到，docker 存在两个容器。从这个例子我们可以知道，同一个镜像，如果使用 `run` 命令创建容器，那么每个容器都是不同的实例。

#### 2.2.3 停止容器

如果容器处在后台运行，我们可以通过 `docker ps` 或者 `docker container ls` 将运行中的容器实例获取到，然后通过 `docker container stop 容器id/容器名` 停止指定容器。

```shell
$ docker container stop b36481b353d3
# b36481b353d3 为第二个容器例子，后台运行的容器
```

#### 2.2.4 启动容器

当然容器也是可以重新启动的，不需要每次创建。通过 `docker container start 容器id` 即可重新启动

```shell
$ docker container start b36481b353d3
```

- 通过 `start` 命令启动的容器都会在后台运行。

#### 2.2.5 进入容器内

通过 `docker exec -it 容器id /bin/bash` 命令进入容器内，通过 `-it` 参数打开容器的交互式终端

```shell
docker exec -it b36481b353d3 /bin/bash
root@b36481b353d3:/#
```

我们可以在此修改容器内的东西，修改完后通过 `exit` 退出容器，通过 `exec` 命令进入容器，退出后容器仍处于运行的状态。

#### 2.2.6 删除容器

通过 `docker container rm 容器id` 删除指定容器。用该方法只能删除一个容器，如果我们想要删除多个容器，可以用空格隔开容器id。如果想删除的容器非常多，可以使用 `docker container prune` 删除所有处于停止状态的容器。

```shell
$ docker container prune
WARNING! This will remove all stopped containers.
Are you sure you want to continue? [y/N] y
Deleted Containers:
a2d6842faeb5cf039420edd684714134c52ca683aefc53a3934792251310ed1d

Total reclaimed space: 0B
```

- 删除容器时，容器需要处于停止状态。我们可以通过 `docker ps -a` 查看停止状态的容器

### 2.3 repository 仓库

由于篇幅问题，有关仓库的内容将会放到下一篇文章中。
