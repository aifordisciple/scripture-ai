#!/bin/bash
# ==============================================================================
# 程序说明：
# 本脚本用于在当前项目目录下重新初始化 Git 仓库（完全保留已有代码文件）。
# 它会安全地移除旧的 .git 目录，重新初始化仓库，并完成首次全局提交。
#
# 参数系统：
#   -b <branch> : 指定初始化的默认主分支名称 (默认值: main)
#   -m <msg>    : 指定初始提交的说明信息 (默认值: "chore: re-initialize git repository")
#   -h          : 显示帮助信息并退出
# ==============================================================================

# 设置默认参数值
BRANCH_NAME="main"
COMMIT_MSG="chore: re-initialize git repository"

# 解析命令行参数
while getopts "b:m:h" opt; do
  case $opt in
    b) BRANCH_NAME="$OPTARG" ;;
    m) COMMIT_MSG="$OPTARG" ;;
    h)
      echo "用法: $0 [-b 分支名称] [-m 提交信息]"
      exit 0
      ;;
    \?)
      echo "无效参数，请使用 -h 查看帮助。" >&2
      exit 1
      ;;
  esac
done

echo "正在清理旧的 Git 记录..."
rm -rf .git

echo "重新初始化 Git 仓库..."
git init -b "$BRANCH_NAME"

echo "暂存所有现有代码文件..."
git add .

echo "执行初始提交..."
git commit -m "$COMMIT_MSG"

echo "Git 仓库重新初始化成功！当前位于分支: $BRANCH_NAME"
