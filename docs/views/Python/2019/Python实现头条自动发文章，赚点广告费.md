---
title: Python实现头条自动发文章，赚点广告费
date: 2019-11-10
categories:
 - Python
tags:
 - 今日头条
 - selenium
 - 滑块验证码
---

前一段时间想尝试一下用 Python 实现自动发一些文章到头条上，因为头条没有提供API发布文章，所以只能通过一些浏览器自动化，实现自动发布文章。但是第一道坎就是登录账号的时候弹出来的滑块验证码。

相信大家对滑块验证码比较熟悉了，就是一张有缺口的背景图，和一张缺口的图片，通过拖拽使背景图和前景图拼接成一张完整的图片。

查找了网上很多文章，基本上滑块验证码实现的方式与头条的并不一样，所以也不能成为解决方案。在 GitHub 搜索「滑块验证码」指定 Python 语言后发现了头条的字样，于是阅读了一遍代码，了解了实现原理。

核心代码分为两个步骤，一是计算需要滑动的距离，二是模拟出人手操作滑动的速度，因为匀速滑动会被认为是机器，不允许通过验证。

## 计算滑动距离

这里利用了 `opencv-python` 这个库提供的 `matchTemplate` 方法，从一张大图中搜索小图，计算出大图上各个区域和小图的相识度，再通过 `minMaxLoc` 方法找到最大值。从而计算需要滑动的距离。具体代码如下

```Python

#  传入滑块背景图片本地路径和滑块本地路径，返回滑块到缺口的距离
def findPic(img_bg_path, img_slider_path):
    """
    找出图像中最佳匹配位置
    :param img_bg_path: 滑块背景图本地路径
    :param img_slider_path: 滑块图片本地路径
    :return: 返回最差匹配、最佳匹配对应的x坐标
    """

    # 读取滑块背景图片，参数是图片路径，OpenCV默认使用BGR模式
    # cv.imread()是 image read的简写
    # img_bg 是一个numpy库ndarray数组对象
    img_bg = cv.imread(img_bg_path)

    # 对滑块背景图片进行处理，由BGR模式转为gray模式（即灰度模式，也就是黑白图片）
    # 为什么要处理？ BGR模式（彩色图片）的数据比黑白图片的数据大，处理后可以加快算法的计算
    # BGR模式：常见的是RGB模式
    # R代表红，red; G代表绿，green;  B代表蓝，blue。
    # RGB模式就是，色彩数据模式，R在高位，G在中间，B在低位。BGR正好相反。
    # 如红色：RGB模式是(255,0,0)，BGR模式是(0,0,255)
    img_bg_gray = cv.cvtColor(img_bg, cv.COLOR_BGR2GRAY)

    # 读取滑块，参数1是图片路径，参数2是使用灰度模式
    img_slider_gray = cv.imread(img_slider_path, 0)

    # 在滑块背景图中匹配滑块。参数cv.TM_CCOEFF_NORMED是opencv中的一种算法
    res = cv.matchTemplate(img_bg_gray, img_slider_gray, cv.TM_CCOEFF_NORMED)

    print('#' * 50)
    print(type(res))  # 打印：<class 'numpy.ndarray'>
    print(res)
    # 打印：一个二维的ndarray数组
    # [[0.05604218  0.05557462  0.06844381... - 0.1784117 - 0.1811338 - 0.18415523]
    #  [0.06151756  0.04408009  0.07010461... - 0.18493137 - 0.18440475 - 0.1843424]
    # [0.0643926    0.06221284  0.0719175... - 0.18742703 - 0.18535161 - 0.1823346]
    # ...
    # [-0.07755355 - 0.08177952 - 0.08642308... - 0.16476074 - 0.16210903 - 0.15467581]
    # [-0.06975575 - 0.07566144 - 0.07783117... - 0.1412715 - 0.15145643 - 0.14800543]
    # [-0.08476129 - 0.08415948 - 0.0949327... - 0.1371379 - 0.14271489 - 0.14166716]]

    print('#' * 50)

    # cv2.minMaxLoc() 从ndarray数组中找到最小值、最大值及他们的坐标
    value = cv.minMaxLoc(res)
    # 得到的value，如：(-0.1653602570295334, 0.6102921366691589, (144, 1), (141, 56))

    print(value, "#" * 30)

    # 获取x坐标，如上面的144、141
    return value[2:][0][0], value[2:][1][0]
```

## 模拟滑动

利用匀加速和匀减速计算位移就可以大概模拟出人拖拽的行为。

大概的思路如下

![模拟滑动](https://mmbiz.qpic.cn/mmbiz_png/7LoS4fBGsHtrDCLqiaxERVK5N5NYMtfr2RuGhucLxHFJ9OfkiciaH9Y4IrvclFTpX5xUef5vV6vMhy65hYfqjkkLg/0?wx_fmt=png)

代码实现如下

```Python
# 返回两个数组：一个用于拖动滑块前进，一个用于拖动滑块折返
def generate_tracks(distance):
    # 给距离加上20，这20像素用在滑块滑过缺口后，减速折返回到缺口
    distance += 20
    v = 0
    t = 0.2
    forward_tracks = []
    current = 0
    mid = distance * 3 / 5  # 减速阀值
    while current < distance:
        if current < mid:
            a = 2  # 加速度为+2
        else:
            a = -3  # 加速度-3
        s = v * t + 0.5 * a * (t ** 2)
        v = v + a * t
        current += s
        forward_tracks.append(round(s))

    back_tracks = [-3, -3, -2, -2, -2, -2, -2, -1, -1, -1, -1]
    return forward_tracks, back_tracks
```

有了这两个核心代码，就可以使用账号密码登录头条了完整代码可以参考 https://github.com/chushiyan/slide_captcha_cracking。
这里并不推荐使用这种方式短时间内进行多次登录，可以使用设置 cookie 的方式跳过登录。


最近在头条发了点搞笑动图，赚了瓶水钱，大家如果也想尝试，可以克隆我的项目 https://github.com/AD-feiben/toutiao。

登录头条后，打开控制台 -> Network 选项，将 cookie 赋值给 config.py 中的 Toutiao_cookie_str 即可。

![](https://user-gold-cdn.xitu.io/2019/11/10/16e55bb23e352a75?w=2160&h=1136&f=png&s=336743)



---

如果还有其他疑问，欢迎大家扫码关注我的公众号【前端develop】给我留言。

![前端develop](/imgs/qrcode.png)