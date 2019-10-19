#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e

# 生成静态文件
npm run build

# 进入生成的文件夹
cd docs/.vuepress/dist

git init
git add .
git commit -m "auto push"
git remote add origin https://${token}@github.com/AD-feiben/ad-feiben.github.io.git
git push -f --set-upstream origin master

cd -
