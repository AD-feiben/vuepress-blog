---
title: Nginx 配置
date: 2018-04-11
categories:
 - Nginx
tags:
 - Nginx
---

> Nginx是一个异步框架的Web服务器，也可以用作反向代理，负载平衡器 和 HTTP缓存。该软件由Igor Sysoev 创建，并于2004年首次公开发布。 同名公司成立于2011年，以提供支持。 Nginx是一款免费的开源软件，根据类BSD许可证的条款发布。[维基百科](https://zh.wikipedia.org/zh-cn/Nginx)

虽说 Nginx 一般都是由后端来配置的，但是如果你想成为一个全栈或者一个有追求的前端的话，了解一下 Nginx 还是很有必要的。如果没有服务器的话，自己可以装一个 Linux 虚拟机练下手。这里我用的 CentOS7 64位的系统来做演示。

### 虚拟机安装

这篇文章主要是介绍 Nginx 的，关于 Mac 安装 CentOS 虚拟机的教程可以参考这篇文章 [Mac Pro 上用 Vmware Fusion 7.1.1 安装 CentOS7](https://my.oschina.net/u/563848/blog/414818)，其他系统就自行查找了。安装好之后可以输入 `ping baidu.com` 测试一下网络是不是正常的。

### SSH 登录虚拟机

虚拟机安装好了之后我一般会用 terminal 连接虚拟机，因为想粘贴一些长命令时不是很好操作。使用命令 `ssh rootName@ip`，如下图所示

![iterm](/imgs/nginx/0.png)

获取虚拟机的 IP 地址，可以在 VMware 的窗口输入 `ifconfig`，如果提示 `ifconfig command not found`，可以参考这篇文章[CentOS 7 下 ifconfig command not found 解决办法](https://my.oschina.net/u/1428349/blog/288708)

### 安装 Nginx

Nginx 安装也十分简单，输入 `yum install -y nginx`，如果无法安装，则先执行这条命令 `rpm -ivh http://nginx.org/packages/centos/7/noarch/RPMS/nginx-release-centos-7-0.el7.ngx.noarch.rpm` 安装 Nginx 源。然后再输入 `yum install -y nginx`。安装好之后可以输入 `whereis nginx` 查看 Nginx 的默认目录。输入 `nginx` 启动服务，然后在浏览器输入虚拟机的 IP 地址进行访问，如果无法访问的话，应该就是虚拟机的防火墙没有开启80端口，输入 `firewall-cmd --permanent --add-port=80/tcp` 开启防火墙的80端口，再输入 `firewall-cmd --reload`。到这里再访问一下虚拟机的 IP 地址，就可以看到 Nginx 的欢迎页面了。参考文章[在CentOS 7中，使用yum安装Nginx](http://www.itmuch.com/install/nginx-yum-install-in-centos7/)。

### 修改配置文件

输入 `cd /etc/nginx` 进入 /etc/nginx 目录，用 `ls` 命令可以看到 nginx.conf 这个文件。这个就是 nginx 的配置文件了。用 `cat nginx.conf` 命令来看下里面写了什么东西。内容大致如下

```sh
user  nginx;
worker_processes  1;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;


events {
    worker_connections  1024;
}


http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    keepalive_timeout  65;

    #gzip  on;

    include /etc/nginx/conf.d/*.conf;
}
```

主要配置内容还是在之后一句 `include /etc/nginx/conf.d/*.conf;` 接下来在进入 /etc/nginx/conf.d/ 目录看下有什么东西。同样用 `ls` 命令可以看到一个 default.conf 文件，内容大致如下

```sh
server {
    listen       80;
    server_name  localhost;

    #charset koi8-r;
    #access_log  /var/log/nginx/host.access.log  main;

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
    }

    #error_page  404              /404.html;

    # redirect server error pages to the static page /50x.html
    #
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }

    # proxy the PHP scripts to Apache listening on 127.0.0.1:80
    #
    #location ~ \.php$ {
    #    proxy_pass   http://127.0.0.1;
    #}

    # pass the PHP scripts to FastCGI server listening on 127.0.0.1:9000
    #
    #location ~ \.php$ {
    #    root           html;
    #    fastcgi_pass   127.0.0.1:9000;
    #    fastcgi_index  index.php;
    #    fastcgi_param  SCRIPT_FILENAME  /scripts$fastcgi_script_name;
    #    include        fastcgi_params;
    #}

    # deny access to .htaccess files, if Apache's document root
    # concurs with nginx's one
    #
    #location ~ /\.ht {
    #    deny  all;
    #}
}
```

可以看到这个服务在监听 80 端口，root 指向项目根目录，即我们访问 localhost （默认为80端口）时，将会查找 /usr/share/nginx/html 这个目录下的文件。我自己的配置一般如下

```sh
server {
    listen 80;
    server_name domain; #使用域名或 IP 地址

    charset utf8; #字符编码
    access_log /path/folder/access.log main; #访问日志
    error_log /path/folder/error.log error; #错误日志

    root /path/folder;
    index index.html;
}
```

日志文件需要我们到对应目录下创建对应的 log 文件，修改完配置文件可以使用 `nginx -s reload` 重启服务。
