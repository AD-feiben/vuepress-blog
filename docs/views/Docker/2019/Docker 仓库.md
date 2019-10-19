---
title: Docker 仓库
date: 2019-10-12
categories:
 - Docker
tags:
 - Docker
---

如果还未了解过 Docker, 建议先阅读上一篇文章 [初识 Docker](http://mp.weixin.qq.com/s?__biz=MzIyMDQyNTc3OA==&mid=2247483767&idx=1&sn=fbf540263518d02ad6fb05d4d9ba1801&chksm=97cd7a2aa0baf33c9c8476654733d5ae136d12daa2524d2d711483921146bd563e9ca54cec79&scene=21#wechat_redirect)。

---

仓库（Repository）就是存放镜像的地方。类似于 `Node` 的 `npm`； `Python` 的 `PyPi`。

注册服务器（Registry）的概念比较容易与仓库混淆。实际上注册服务器是用来管理仓库的服务器，一个服务器上可以存在多个仓库，而每个仓库下可以有多个镜像。

例如对于仓库地址 `hub.dockerpool.com/nginx` 来说，`hub.dockerpool.com` 是注册服务器的地址，`nginx` 是仓库名。

## Docker Hub

目前 Docker 官方维护的一个公共仓库，大部分需求我们都可以从 Docker Hub 中直接下载镜像来实现。

### 注册

我们可以在 https://hub.docker.com/ 注册一个 Docker 账号。

### 登录

可以通过 `docker login` 命令在终端输入用户名及密码来完成 Docker Hub 的登录。

我们也可以通过 `docker logout` 退出登录。

### 镜像分类

通过上一篇文章可以知道，使用 `docker search` 搜索镜像时，搜索出来可以看到下面的镜像列表。
```bash
$ docker search nginx
NAME                              DESCRIPTION                                     STARS               OFFICIAL            AUTOMATED
nginx                             Official build of Nginx.                        12036               [OK]
jwilder/nginx-proxy               Automated Nginx reverse proxy for docker con…   1671                                    [OK]
richarvey/nginx-php-fpm           Container running Nginx + PHP-FPM capable of…   742                                     [OK]
linuxserver/nginx                 An Nginx container, brought to you by LinuxS…   78
bitnami/nginx                     Bitnami nginx Docker Image                      71                                      [OK]
tiangolo/nginx-rtmp               Docker image with Nginx using the nginx-rtmp…   56                                      [OK]
nginxdemos/hello                  NGINX webserver that serves a simple page co…   28                                      [OK]
jlesage/nginx-proxy-manager       Docker container for Nginx Proxy Manager        24                                      [OK]
jc21/nginx-proxy-manager          Docker container for managing Nginx proxy ho…   24
nginx/nginx-ingress               NGINX Ingress Controller for Kubernetes         22
privatebin/nginx-fpm-alpine       PrivateBin running on an Nginx, php-fpm & Al…   18                                      [OK]
schmunk42/nginx-redirect          A very simple container to redirect HTTP tra…   17                                      [OK]
blacklabelops/nginx               Dockerized Nginx Reverse Proxy Server.          12                                      [OK]
```
根据是否是官方提供，可以将镜像分为两类。

一类是类似 `nginx` 这样的镜像，被称为基础镜像或跟镜像。这些基础镜像由 Docker 公司创建、验证、支持、提供。这样的镜像往往使用单个单词作为名字。

还有一种类型，比如 `feiben/nginx` 镜像，它是由 Docker Hub 的注册用户创建并维护的，往往带有用户名称前缀。可以通过前缀 `username/` 来指定使用某个用户提供的镜像，比如 `feiben` 用户。

### 推送镜像

用户登录后可以通过 `docker push` 命令来把自己的镜像推送到 Docker Hub，例如将 `nginx` 镜像改成我们自己的镜像，然后推送到 Docker Hub。

首先通过 `docker pull nginx` 将 `nginx` 镜像下载到本地。

给 `nginx` 添加标签 `docker tag nginx feiben/nginx:1.17.5`

```bash
$ docker images
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
feiben/nginx        1.17.5              f949e7d76d63        2 weeks ago         126MB
nginx               latest              f949e7d76d63        2 weeks ago         126MB
```

将自己的镜像推送到 Docker Hub

```bash
$ docker push feiben/nginx:1.17.5
The push refers to repository [docker.io/feiben/nginx]
509a5ea4aeeb: Mounted from library/nginx
3bb51901dfa3: Mounted from library/nginx
2db44bce66cd: Mounted from library/nginx
1.17.5: digest: sha256:066edc156bcada86155fd80ae03667cf3811c499df73815a2b76e43755ebbc76 size: 948
```

稍等片刻，我们就可以搜索出推送的镜像了

```bash
$ docker search feiben
NAME                DESCRIPTION         STARS               OFFICIAL            AUTOMATED
feiben/nginx                            0
```

### 自动构建

我们可以通过 Docker Hub 指定跟踪一个目标网站（支持 GitHub 或 BitBucket）上的项目，项目一旦有新的提交或者创建了新标签，将会触发 Docker Hub 自动构建镜像并推送到 Docker Hub中。

设置自动构建的步骤如下：

1. 登录 Docker Hub
2. 点击头像，选择 Account Setting 再选择 Linked Accounts 管理账号
3. 在 Docker Hub 中新建或选择已有的仓库，在 Builds 选项卡中选择 Configure Automated Builds
4. 选取一个目标网站中的项目（需要含 Dockerfile）和分支
5. 指定 Dockerfile 的位置，并保存

完成自动构建配置之后，指定的分支一旦提交代码就会触发自动构建，我们可以在仓库页面的 Timeline 选项卡中查看每次构建的状态。

除了 Docker Hub 的自动构建外，我们也可以使用 Travis CI 等持续集成工具来实现自动构建。


## 私有仓库

公司的项目一般不予许我们上传到 Docker Hub 这类的公共仓库中，所有学会创建一个私有仓库也是非常必要的。

### 容器运行

我们可以通过获取官方的 `registry` 镜像来运行。

```bash
$ docker run -d -p 5000:5000 --restart=always --name registry registry
```

这将使用官方提供的 `registry` 镜像来启动私有仓库。默认情况下，仓库会被创建在容器的 `/var/lib/registry` 目录下。我们可以通过 `-v` 参数将镜像文件存放在本地的指定路径。

```bash
$ docker run -d \
> -p 5000:5000 \
> -v /opt/data/registry:/var/lib/registry \
> --restart=always \
> registry
```

这时我们可以通过浏览器访问 `http://domain:5000/v2/_catalog` 查看仓库是否启动成功。

- 其中 `domain` 是你的域名或 ip 地址，下文中的 `domain` 同理。

### 在私有仓库搜索、上传、下载镜像

#### 上传镜像

首先使用 `docker tag` 将本地的 `nginx` 镜像添加标签

```bash
$ docker tag nginx:latest domain/nginx:latest
```

接下来就可以使用 `docker push` 命令将镜像推送到我们的私有仓库中

```bash
$ docker push domain/nginx:latest
The push refers to repository [domain/nginx]
Get https://domain/v2/: EOF
```

出现上面的提示时，说明推送失败了。因为 Docker 默认使用 HTTPS 的方式推送镜像。我们可以通过 Docker 的配置来取消这个限制。

对于 Linux 系统，我们可以在 `/etc/docker/deamon.json` （`deamon.josn` 文件不存在则新建该文件）添加下面的配置

```json
{ "insecure-registries": ["domain:5000"] }
```

对于桌面版，我们可以在 Docker 的设置 `Daemon` 选项中的 `Insecure registries` 中加上 `domain:5000`。

【注】如果仓库主机是远程服务器的话，需要将服务器与本地的 docker 配置进行修改

设置完成后再使用上面的命令进行推送。除了上面这种方式外，我们也可以将私有仓库的地址配置成支持 `HTTPS` 访问的，本文就不作展开了。

```bash
$ docker push domain:5000/nginx:latest
The push refers to repository [domain:5000/nginx]
509a5ea4aeeb: Pushed
3bb51901dfa3: Pushed
2db44bce66cd: Pushed
latest: digest: sha256:066edc156bcada86155fd80ae03667cf3811c499df73815a2b76e43755ebbc76 size: 948
```

当看到上面的信息时，说明已经推送成功了。我们可以再次访问 `http://domain:5000/v2/_catalog` 进行验证

```bash
$ curl http://domain:5000/v2/_catalog
{"repositories":["nginx"]}
```

看到这个说明上传成功了。

#### 搜索镜像

搜索私有仓库的镜像并不能用 `docker search` 命令, 只能通过 `http://domain:5000/v2/image_name/tags/list` 查看指定镜像存在的 `tag` 列表

```bash
$ curl domain:5000/v2/nginx/tags/list
{"name":"nginx","tags":["latest"]}
```

#### 下载镜像

首先我们通过 `docker rmi` 将本地的镜像删除（取消标签）。

```bash
$ docker rmi domain:5000/nginx
Untagged: domain:5000/nginx:latest
Untagged: domain:5000/nginx@sha256:066edc156bcada86155fd80ae03667cf3811c499df73815a2b76e43755ebbc76
```

再使用 `docker images` 确认 `domain:5000/nginx` 这个镜像在本地不存在，接下来我们就可以从私有仓库进行下载。


```bash
$ docker pull domain:5000/nginx:latest
```

除了使用官方提供的 Registry，我们也可以使用 Nexus3.x 来创建仓库，关于如何使用 Nexus 版本的仓库将放到下一篇文章中。当然你也可以从 https://docker_practice.gitee.io/zh-cn/repository/nexus3_registry.html 学习。