---
title: 使用 Dockerfile 制作镜像
date: 2019-10-25
categories:
 - Docker
tags:
 - Docker
 - Dockerfile
---

前面几篇文章已经给大家介绍了 Docker 的基本概念，相信大家也会使用 Docker 运行自己想要的容器了。但是只有学会制作镜像，才能将 Docker 应用到我们的项目中去。下面我们就来学习如何使用 Dockerfile 来制作镜像。

Dockerfile 是一个文本文件，里面的内容是一条条的指令，每一条指令将会构建一层，因此每条指令的内容就是在描述该层应当如何创建。

## 编写 Dockerfile

接下来以 nginx 镜像为例，定制一个简单的镜像，首先创建一个目录 mynginx，进入目录再创建一个文本文件，名字为 Dockerfile。

```sh
$ mkdir mynginx
$ cd mynginx
$ touch Dockerfile
```

把以下内容写到 Dockerfile 中

```docker
FROM nginx
RUN echo '<h1>Hello, Docker!<h1>' > /usr/share/nginx/html/index.html
```

其中 `FROM` 用来指定基础镜像，上面的例子是以 nginx 为基础镜像。

`RUN` 命令则表示执行一个 shell 命令，将文本写进 `index.html`。

## 构建命令详解

编写完 Dockerfile 之后就可以用来构建镜像。构建 docker 镜像的命令如下：

```sh
$ docker build [OPTIONS] PATH | URL | -
```

选项的说明如下：


OPTIONS | 说明
---|---
--build-arg=[] | 设置镜像创建时的变量
--cpu-shares | 设置 CPU 使用权重
--cpu-period | 限制 CPU CFS 周期
--cpu-quota | 限制 CPU CFS 配额
--cpuset-cpus | 指定使用的 CPU
--cpuset-mems | 指定使用的内存 id
--disable-content-trust | 忽略检验，默认开启
-f | 指定要使用的 Dockerfile 路径
--force-rm | 设置镜像过程中删除中间容器
--isolation | 使用容器隔离技术
--label=[] | 设置镜像使用的元数据
-m | 设置内存最大最
--memory-swap | 设置 Swap 的最大值为内存 + swap，'-1' 表示不限 swap
--no-cache | 创建镜像的过程中不适用缓存
--pull | 尝试更新镜像的新版本
--quiet,-q | 安静模式，成功后只输出镜像 ID
--rm | 设置镜像成功后删除中间容器
--shm-size | 设置 /dev/shm 的大小，默认值是 64M
--ulimit | Ulimit 配置
--tag,-t | 镜像的名字及标签，通常 name:tag 或者 name 格式，可以在一次构建中为一个镜像设置多个标签
--network | 默认 default。在构建期间设置 RUN 指令的网络模式

下面举几个例子，说明选项的用法

- 使用当前目录的 Dockerfile 创建镜像，标签为 `fedevelop/example:v1`

```sh
$ docker build -t fedevelop/example:v1 .
```

- 使用 URL github.com/ad-feiben/qc-remind 的 Dockerfile 创建镜像

```sh
$ docker build github.com/ad-feiben/qc-remind
```

- 通过 -f Dockerfile 文件的位置

```sh
$ docker build -f /path/to/a/Dockerfile .
```



回到 `mynginx` 目录中执行下面的命令


```sh
$ docker build -t nginx:v2 .
Sending build context to Docker daemon  2.048kB
Step 1/2 : FROM nginx
 ---> f949e7d76d63
Step 2/2 : RUN echo '<h1>Hello, Docker!</h1>' > /usr/share/nginx/html/index.html
 ---> Running in 88dc64292fa7
Removing intermediate container 88dc64292fa7
 ---> 5d1e253d361c
Successfully built 5d1e253d361c
Successfully tagged nginx:v2
```

注意不要漏了最后的 `.`，`.` 代表将当前目录设置为镜像构建上下文（Context）。

例如 Dockerfile 的内容如下：

```docker
COPY ./requirements.txt /app/
```

*意思为复制上下文目录下的 `requirements.txt`，与 Dockerfile、执行 `docker build` 所在的目录无关。*


构建完成后，我们可以通过 `Docker images` 查看我们构建的镜像

```sh
$ docker images
docker images
REPOSITORY              TAG                 IMAGE ID            CREATED              SIZE
nginx                   v2                  5d1e253d361c        About a minute ago   126MB
nginx                   latest              f949e7d76d63        4 weeks ago          126MB
```

接下来用我们定制的镜像来启动一个容器看看，其中 `5d1e253d361c` 替换为你的镜像 id

```sh
$ docker run -it -p 80:80 5d1e253d361c
```


浏览器打开 http://localhost/ 可以看到页面显示的是 `Hello, Docker!`，说明我们的 Dockerfile 中的命令生效了。

## 指令详解

**FROM 指定基础镜像**

*`FROM` 是用来指定基础镜像，这个命令是 Dockerfile 中必备的指令，并且必须是第一条指令。*

假如不需要基础镜像，可以使用空白镜像 `scratch` 作为基础镜像。`scratch` 这个镜像是虚拟的，实际并不存在。

```docker
FROM scratch
...
```

**RUN 执行命令**

从上面的例子中可以看到 `RUN` 可以执行一个 `shell` 命令，除了此之外还有另一种格式。

`exec` 格式：`RUN ["可执行文件", "参数"]`。


我们在编写 Dockerfile 的时候需要尽可能将指令链接起来，因为 Dockerfile 中的每一条指令都会建立一层，如果建立太多层，不仅会使得镜像非常臃肿，也会增加构建时间。


```sh
# 错误示范
FROM debian:stretch

RUN apt-get update
RUN apt-get install -y gcc libc6-dev make wget
RUN wget -O redis.tar.gz "http://download.redis.io/releases/redis-5.0.3.tar.gz"
RUN mkdir -p /usr/src/redis
RUN tar -xzf redis.tar.gz -C /usr/src/redis --strip-components=1
RUN make -C /usr/src/redis
RUN make -C /usr/src/redis install
```

正确的写法如下，使用 `&&` 将多条命令合并为一条，并且删除不必要的文件、清理 `apt` 缓存等，尽量保持容器干净。如果没有做清理工作的话，这些冗余的文件等将会带到下一层，并且会一直跟随镜像。

```sh
FROM debian:stretch

RUN buildDeps='gcc libc6-dev make wget' \
    && apt-get update \
    && apt-get install -y $buildDeps \
    && wget -O redis.tar.gz "http://download.redis.io/releases/redis-5.0.3.tar.gz" \
    && mkdir -p /usr/src/redis \
    && tar -xzf redis.tar.gz -C /usr/src/redis --strip-components=1 \
    && make -C /usr/src/redis \
    && make -C /usr/src/redis install \
    && rm -rf /var/lib/apt/lists/* \
    && rm redis.tar.gz \
    && rm -r /usr/src/redis \
    && apt-get purge -y --auto-remove $buildDeps
```

**WORKDIR 指定工作目录**

`WORKDIR` 的格式为 `WORKDIR <工作目录路径>`

当使用 `WORKDIR` 指定工作路径后，以后的每一层的当前目录都会被改为工作目录，如果目录不存在，`WORKDIR` 会帮助我们创建目录。

如果需要改变以后各层的工作目录的位置，只需要再使用 WORKDIR 指令即可。


**COPY 复制文件**

`COPY` 的格式为 `COPY [--chown=<user>:<group>] <源路径>... <目标路径>`

`源路径`可以是多个，也可以使用通配符，例如下面这样：

```docker
COPY hom* /mydir/
COPY hom?.txt /mydir/
```

`目标路径`可以是容器内的绝对路径，也可以相对工作目录的相对路径。目标路径不需要我们创建，如果目标路径不存在会在复制文件前先行创建缺失的目录。

使用 `COPY` 复制文件时，会保留文件的元数据，比如读写权限，文件变更的时间等。如果需要修改文件的所属用户及所属组，可以通过添加 `--chown=<user>:<group>` 选项进行修改。

**CMD 容器启动命令**

shell 格式为 `CMD <命令>`

exec 格式为 `CND ["可执行文件", "参数1", "参数2"]`

使用 shell 格式的话，实际的命令会被包装成 `sh -c` 的形式进行执行，比如：

`CMD echo $HOME` 在实际执行中，将会变成 `CMD [ "sh", "-c", "echo $HOME" ]`

*所以在使用 `CMD` 的时候一般推荐使用 `exec` 的格式，需要注意的是 `exec` 的格式会被解析成 `JSON` 数组，所以只能够使用双引号，而不能使用单引号。*

---

Dockerfile 的指令不止这么几个，感兴趣的小伙伴可以到 https://yeasy.gitbooks.io/docker_practice/image/dockerfile/ 自行查看。


## 示例

下面将通过我的 Python 项目来演示，怎么编写一个 Dockerfile，文件地址在 https://raw.githubusercontent.com/AD-feiben/qc-remind/master/Dockerfile

文件的内容如下:

```docker
# 指定基础镜像
FROM python:3.7.4

# 设置镜像作者
MAINTAINER feiben <feiben.dev@gmail.com>

# 设置工作目录
WORKDIR /app

# 复制上下文的文件到容器的 app 目录下
# 不需要复制到镜像的文件可以使用 .dockerignore 进行忽略
COPY . /app

# 执行下面命令，同步时区，安装依赖
RUN cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo 'Asia/Shanghai' >/etc/timezone \
    && pip install -r requirements.txt

# 启动容器
CMD ["python", "main.py", "--log-file-prefix", "qc-remind.log"]
```

当我们的代码编写完成后，就可以执行 `docker build -t <name>:<tag> .` 将代码打包成一个 Docker 镜像，再 push 到镜像仓库中。

## 部署

按照传统的方式部署项目，通常需要在服务器安装一套运行环境，而且常常会遇到环境不一致导致本地开发没问题，一到线上部署就出现各种问题的情况。并且一旦服务器到期，迁移的工作量也是十分巨大。

而使用 Docker，我们只需要再服务器安装一个 Docker 环境即可，部署项目只需要执行 `docker run xxx`。不仅减少了安装环境的时间，也保证了环境的一致性。



---

如果你喜欢我的文章，希望可以关注一下我的公众号【前端develop】

![前端develop](/imgs/qrcode.png)
