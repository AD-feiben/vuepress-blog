---
title: validate-npm-package-name 源码学习
date: 2022-02-12
categories:
 - 前端
tags:
 - npm
 - validate-npm-package-name
 - 源码
---

## 用法

validate-npm-package-name 这个 npm 包的作用就是验证项目名称 (npm 包名) 是否合法，很多的 cli 工具都有使用。例如

vue-cli: https://github.com/vuejs/vue-cli/blob/HEAD/packages/@vue/cli/lib/create.js#L8

create-react-app: https://github.com/facebook/create-react-app/blob/04482a6c2c6639c19deb330c48e4fa5573a1654e/packages/create-react-app/createReactApp.js#L48

<!-- more -->

vue-cli 的用法如下

```javascript
const result = validateProjectName(name)
// 名字不合法
if (!result.validForNewPackages) {
  // 输出错误信息
  console.error(chalk.red(`Invalid project name: "${name}"`))
  result.errors && result.errors.forEach((err) => {
    console.error(chalk.red.dim("Error: " + err))
  })
  result.warnings && result.warnings.forEach((warn) => {
    console.error(chalk.red.dim("Warning: " + warn))
  })
  // 结束进程
  exit(1);
}
```

## 测试用例

测试用例只有一个文件，
https://github.com/npm/validate-npm-package-name/blob/HEAD/test/index.js

这里列举了各种用例，当没有文档时，可以通过这些用例初步了解这个包的用法，而且还可以知道作者想要设计的功能。

复制两个用例看下

```javascript
// 不能以 . 开头
t.deepEqual(validate('.start-with-period'), {
  validForNewPackages: false,
  validForOldPackages: false,
  errors: ['name cannot start with a period']})

// 不能以 _ 开头
t.deepEqual(validate('_start-with-underscore'), {
  validForNewPackages: false,
  validForOldPackages: false,
  errors: ['name cannot start with an underscore']})
```

我们开发自己项目时，可以先写测试用例，再围绕这些用例进行实现，这样可以提高代码的稳定性。将来增加功能时，这些测试用例可以帮助我们对旧功能进行验证，避免牵一发而动全身。

## 源码
从 package.json 中可以了解到本库的入口文件 index.js

```json
  // package.json
  // ...
  "main": "index.js",
  // ...
```

从 index.js 的内容中可以发现该项目只有这一个 js 文件 https://github.com/npm/validate-npm-package-name/blob/HEAD/index.js


```javascript
'use strict'

// 用于匹配 scope package，例如 @vue/reactivity
var scopedPackagePattern = new RegExp('^(?:@([^/]+?)[/])?([^/]+?)$')
// node 内置模块名组成的列表
var builtins = require('builtins')
// 黑名单 (保留字)
var blacklist = [
  'node_modules',
  'favicon.ico'
]

// 入口函数
var validate = module.exports = function (name) {
  // 警告：用于表示过去允许、如今不允许的 package name
  var warnings = []
  // 存储不符号合格的包名的规则
  var errors = []

  // 格式校验
  if (name === null) {
    errors.push('name cannot be null')
    // 使用 done 函数构造返回值
    return done(warnings, errors)
  }

  if (name === undefined) {
    errors.push('name cannot be undefined')
    return done(warnings, errors)
  }

  if (typeof name !== 'string') {
    errors.push('name must be a string')
    return done(warnings, errors)
  }

  // name 长度不能为 0
  if (!name.length) {
    errors.push('name length must be greater than zero')
  }

  // name 不能以 . 开头
  if (name.match(/^\./)) {
    errors.push('name cannot start with a period')
  }

  // name 不能以 _ 开头
  if (name.match(/^_/)) {
    errors.push('name cannot start with an underscore')
  }

  // name 不能包含前空格或后空格
  if (name.trim() !== name) {
    errors.push('name cannot contain leading or trailing spaces')
  }

  // No funny business
  // name 不能为保留字
  blacklist.forEach(function (blacklistedName) {
    if (name.toLowerCase() === blacklistedName) {
      errors.push(blacklistedName + ' is a blacklisted name')
    }
  })

  // Generate warnings for stuff that used to be allowed

  // core module names like http, events, util, etc
  // name 与 node 内置模块名相同，则生成警告
  builtins.forEach(function (builtin) {
    if (name.toLowerCase() === builtin) {
      warnings.push(builtin + ' is a core module name')
    }
  })

  // really-long-package-names-------------------------------such--length-----many---wow
  // the thisisareallyreallylongpackagenameitshouldpublishdowenowhavealimittothelengthofpackagenames-poch.
  // name 不能超过 214 个字符
  if (name.length > 214) {
    warnings.push('name can no longer contain more than 214 characters')
  }

  // mIxeD CaSe nAMEs
  // name 不能有大写字母
  if (name.toLowerCase() !== name) {
    warnings.push('name can no longer contain capital letters')
  }

  // name 不能包含特殊字符 ~'!()*
  if (/[~'!()*]/.test(name.split('/').slice(-1)[0])) {
    warnings.push('name can no longer contain special characters ("~\'!()*")')
  }

  if (encodeURIComponent(name) !== name) {
    // Maybe it's a scoped package name, like @user/package
    // 处理 scope package，比如 @vue/reactivity
    var nameMatch = name.match(scopedPackagePattern)
    if (nameMatch) {
      var user = nameMatch[1] // vue
      var pkg = nameMatch[2] // reactivity
      if (encodeURIComponent(user) === user && encodeURIComponent(pkg) === pkg) {
        // scope package 没有异常，直接返回
        return done(warnings, errors)
      }
    }

    // name 存在 non-url-safe 的字符
    errors.push('name can only contain URL-friendly characters')
  }

  return done(warnings, errors)
}

// 将匹配 scope package 的正则也进行导出
validate.scopedPackagePattern = scopedPackagePattern

// 通过 warnings，errors 构造返回值
var done = function (warnings, errors) {
  var result = {
    validForNewPackages: errors.length === 0 && warnings.length === 0,
    validForOldPackages: errors.length === 0,
    warnings: warnings,
    errors: errors
  }
  if (!result.warnings.length) delete result.warnings
  if (!result.errors.length) delete result.errors
  return result
}

```

以上则是 validate-npm-package-name 源码部分，功能还是比较简单。


## 总结


不了解该库之前，直接读源码是非常迷茫的。这时可以先读测试用例，了解这个库的基本功能。

了解完基本功能之后可以从 package.json 入手，寻找入口文件并结合测试用例进行阅读。

从源码中学到可以从 builtins 获取 Node 内置的模块。以及项目开发规范，先制定需求（编写测试用例）再围绕测试用例进行开发，实现需求。


希望文章的内容能为你提供一丝丝帮助，如有错误，还望指正。