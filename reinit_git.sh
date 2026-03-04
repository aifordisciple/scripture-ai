#!/bin/bash
# ==============================================================================
# 程序说明：
# 本脚本用于在当前项目目录下重新初始化 Git 仓库（完全保留已有代码文件）。
# 它会安全地移除旧的 .git 目录，重新初始化仓库，并完成首次全局提交。
# 升级功能：支持直接关联并推送到远程 GitHub 仓库。
#
# 参数系统：
#   -b <branch> : 指定初始化的默认主分支名称 (默认值: main)
#   -m <msg>    : 指定初始提交的说明信息 (默认值: "chore: re-initialize git repository")
#   -r <url>    : 指定远程 GitHub 仓库地址 (例如: git@github.com:user/repo.git)
#   -f          : 强制推送到远程仓库 (覆盖远程旧历史记录)
#   -h          : 显示帮助信息并退出
# ==============================================================================

# 设置默认参数值
BRANCH_NAME="main"
COMMIT_MSG="chore: re-initialize git repository"
REMOTE_URL="git@github.com:aifordisciple/auto.git"
FORCE_PUSH=false


# 解析命令行参数
while getopts "b:m:r:fh" opt; do
  case $opt in
    b) BRANCH_NAME="$OPTARG" ;;
    m) COMMIT_MSG="$OPTARG" ;;
    r) REMOTE_URL="$OPTARG" ;;
    f) FORCE_PUSH=true ;;
    h)
      echo "用法: $0 [-b 分支名称] [-m 提交信息] [-r 远程仓库地址] [-f]"
      echo "  -b: 分支名称 (默认: main)"
      echo "  -m: 提交信息 (默认: chore: re-initialize git repository)"
      echo "  -r: Github 远程仓库地址 (若提供，则自动推送到该地址)"
      echo "  -f: 强制推送到远程仓库 (--force)"
      exit 0
      ;;
    \?)
      echo "无效参数，请使用 -h 查看帮助。" >&2
      exit 1
      ;;
  esac
done

echo "正在清理旧的 Git 记录..."
# rm -rf .git

echo "重新初始化 Git 仓库..."
# git init -b "$BRANCH_NAME"

echo "暂存所有现有代码文件..."
git add .

echo "执行初始提交..."
git commit -m "$COMMIT_MSG"

echo "Git 仓库重新初始化成功！当前位于分支: $BRANCH_NAME"

# 处理远程仓库和推送
if [ -n "$REMOTE_URL" ]; then
  echo "正在关联远程仓库: $REMOTE_URL ..."
  # git remote add origin "$REMOTE_URL"
  
  if [ "$FORCE_PUSH" = true ]; then
    echo "⚠️ 正在强制推送到远程仓库 (-f)..."
    git push -u origin "$BRANCH_NAME" --force
  else
    echo "正在推送到远程仓库..."
    git push -u origin "$BRANCH_NAME"
  fi
  echo "✅ 远程推送完成！"
fi