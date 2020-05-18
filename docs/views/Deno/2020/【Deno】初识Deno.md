---
title: 【Deno】初识Deno
date: 2020-05-19
categories:
 - Deno
tags:
 - Deno
---

5月13号 Deno 发布了 1.0 版本，Deno 的发布引起了很多人关注。


官网描述 Deno 是一个安全的 JavaScript 和 TypeScript 的运行时。

> A secure runtime for JavaScript and TypeScript.  ---https://deno.land/


Deno 的作者 Ryan Dahl (ry) 就是 Node.js 的作者，因为 Node.js 存在设计上存在缺陷，而且 Node.js 拥有大量的用户使得 Node.js 的发展变得困难、缓慢，所以 Ryan Dahl 选择离开 Node.js 开发 Deno。

<!-- more -->


## Deno 与 Node.js 的区别

### 异步操作

在 Node.js 设计之初，JavaScript 还没有 Promise、async/await 的概念。Node.js 通过回调函数的方式实现异步操作。这就导致了在 Node.js 中存在回调函数和 Promise 两种写法。

而 Deno 所有的异步操作将会返回一个 Promise。

### 模块

Node.js 使用与 ES 模块不兼容的 CommonJS，Deno 使用的则是浏览器一致的 ES 模块。

### 外部模块

Node.js 使用 NPM 管理外部模块，node_modules 极其复杂。

Deno 通过 url 链接外部模块，可以使用绝对路径或相对路径导入模块，因此外部模块可以存放在任意系统，不需要集中存放在类似 NPM 的模块管理中心。

例如：

```Deno
import { foo } from "https://foo.com/foo.ts";
import { foo } from "./foo.ts";
```

*需要注意的是在 Deno 中使用外部模块不能省略后缀。*

Deno 在首次运行时会将外部模块下载到本地缓存。


### 安全

Node.js 没有任何安全性可言，因此是不是会传出某个 NPM 包中存在恶意代码的消息。

而 Deno 在执行时需要开发者进行对应操作的授权。

```bash
# 允许所有授权
-A, --allow-all                    Allow all permissions

# 允许读取环境变量
    --allow-env                    Allow environment access

# 允许高精度时间测量
    --allow-hrtime                 Allow high resolution time measurement

# 允许网络通信，支持指定域名
    --allow-net=<allow-net>        Allow network access

# 允许加载插件
    --allow-plugin                 Allow loading plugins

# 允许文件读操作，可以指定文件
    --allow-read=<allow-read>      Allow file system read access

# 允许运行子进程
    --allow-run                    Allow running subprocesses

# 允许文件写操作，可以指定文件
    --allow-write=<allow-write>    Allow file system write access
```


### 支持 TypeScript

Deno 不需要额外配置，默认就支持 TypeScript。Deno 会通过文件后缀名进行判断，`.ts` 文件会先通过 TS 编译器转成 JS，`.js` 文件则会传入 `V8` 引擎运行。

## 安装 Deno

在 Deno 的官网中提供了各个系统的安装方法，这里简单搬运一下。

**Using Shell (macOS, Linux):**

```bash
curl -fsSL https://deno.land/x/install/install.sh | sh
```

**Using PowerShell (Windows):**

```bash
iwr https://deno.land/x/install/install.ps1 -useb | iex
```

**Using Cargo (Windows, macOS, Linux):**

```bash
cargo install deno
```

**Using Homebrew (macOS):**

```bash
brew install deno
```

**Using Chocolatey (Windows):**

```bash
choco install deno
```

**Using Scoop (Windows):**

```bash
scoop install deno
```

关于 Deno 更多安装选项，例如指定 Deno 版本安装等可以到 https://github.com/denoland/deno_install 查看。

## Deno 的运行参数及子命令

通过执行 `deno -h` 可以查看 Deno 的帮助信息。

```bash
# deno 版本
deno 0.42.0
A secure JavaScript and TypeScript runtime

# 文档地址
Docs: https://deno.land/std/manual.md
# 标准库及第三方模块的地址
Modules: https://deno.land/std/ https://deno.land/x/
# bug 反馈地址
Bugs: https://github.com/denoland/deno/issues

# 无需参数就可启动 REPL 环境
To start the REPL, supply no arguments:
  deno

# 执行脚本
To execute a script:
  deno run https://deno.land/std/examples/welcome.ts
  deno https://deno.land/std/examples/welcome.ts

# 在 shell 中执行代码
To evaluate code in the shell:
  deno eval "console.log(30933 + 404)"

# 运行 deno help run 查看 run 命令的特殊标记
Run 'deno help run' for 'run'-specific flags.

# 用法 deno [参数] [子命令]
USAGE:
    deno [OPTIONS] [SUBCOMMAND]

OPTIONS:
    # 查看帮助信息
    -h, --help                     Prints help information
    # 设置日志级别，可选值 [debug, info]
    -L, --log-level <log-level>    Set log level [possible values: debug, info]
    # 禁止输出
    -q, --quiet                    Suppress diagnostic output
    # 查看版本信息
    -V, --version                  Prints version information

SUBCOMMANDS:
    # 将模块和依赖打包成单文件
    bundle         Bundle module and dependencies into single file
    # 缓存依赖
    cache          Cache the dependencies
    completions    Generate shell completions
    # 显示文档
    doc            Show documentation for a module
    # 执行脚本
    eval           Eval script
    # 格式化源码
    fmt            Format source files
    # 打印子命令帮助信息
    help           Prints this message or the help of the given subcommand(s)
    # 显示源码的依赖信息或缓存信息
    info           Show info about cache or info related to source file
    # 将脚本安装为可执行文件
    install        Install script as an executable
    # 进入 REPL 环境
    repl           Read Eval Print Loop
    # 运行脚本
    run            Run a program given a filename or url to the module
    # 运行测试
    test           Run tests
    # 打印运行时 TS 类型声明
    types          Print runtime TypeScript declarations
    # 升级 Deno 到最新版本
    upgrade        Upgrade deno executable to newest version

# 环境变量
ENVIRONMENT VARIABLES:
    # 设置 deno 的基础目录，默认在 $HOME/.deno
    DENO_DIR             Set deno's base directory (defaults to $HOME/.deno)
    # deno install 输出的目录，默认在 $HOME/.deno/bin
    DENO_INSTALL_ROOT    Set deno install's output directory
                         (defaults to $HOME/.deno/bin)
    # 关闭颜色
    NO_COLOR             Set to disable color
    # http 代理
    HTTP_PROXY           Proxy address for HTTP requests
                         (module downloads, fetch)
    # https 代理
    HTTPS_PROXY          Same but for HTTPS
```

## 案例

开启 http 服务

```ts
// demo1.ts
import { serve } from 'https://deno.land/std@0.50.0/http/server.ts';

for await (const req of serve({ hostname: '0.0.0.0', port: 8000 })) {
  req.respond({ body: 'Hello Deno. \n' });
}
```

运行

```bash
deno run demo1.ts
```

```bash
Compile file:///Users/test/demo1.ts
Download https://deno.land/std@0.50.0/http/server.ts
...
error: Uncaught PermissionDenied: network access to "127.0.0.1:8000", run again with the --allow-net flag
    at unwrapResponse ($deno$/ops/dispatch_json.ts:43:11)
    at Object.sendSync ($deno$/ops/dispatch_json.ts:72:10)
    at Object.listen ($deno$/ops/net.ts:51:10)
    at listen ($deno$/net.ts:164:18)
    at serve (server.ts:261:20)
    at demo1.ts:3:25
```

首先会编译代码，编译完成后下载外部模块到本地，下载完成就可以执行代码。执行时会检查所需权限，如果没有授权则会报 `error: Uncaught PermissionDenied`。


加上 `--allow-net` 再执行即可。

## 总结

相比于 Node.js，Deno 在使用上更加简单，大部分 api 与浏览器一致，作为前端码农应该会更加容易接受 Deno。在将来我们可以根据项目来选择 Node.js 或者 Deno，这对于我们来说应该是一件好事。


短期内 Deno 还不能用于生产环境，通过各大框架对 TypeScript 的支持可以知道 TypeScript 对于前端来说已经越来越重要了，所以还是抓紧学习 TypeScript 吧。


 ---

 以上内容均是个人理解，如果有讲的不对的地方，还请各位大佬指点。

如果觉得内容还不错的话，希望小伙伴可以帮忙点赞转发，给更多的同学看到，感谢感谢！


![前端develop](/imgs/qrcode.png)