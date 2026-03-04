#!/bin/bash
# ==============================================================================
# 程序说明：
# 本脚本用于在代码修改完成后，自动将变动提交至 Git 仓库，
# 并在项目根目录下重启并构建 Docker 服务（执行 docker-compose 流程）。
# 
# 参数系统：
#   -s <summary> : 指定 Git 提交的简要总结 (第一行)，默认值: "update: 自动保存代码修改"
#   -d <details> : 指定 Git 提交的详细修改说明 (Comments)，默认值: "执行了未详细说明的代码更新"
#   -h           : 显示帮助信息并退出
# ==============================================================================

# 设置默认参数值
SUMMARY="update: 自动保存代码修改"
DETAILS="执行了未详细说明的代码更新"

# 解析命令行参数
while getopts "s:d:h" opt; do
  case $opt in
    s) SUMMARY="$OPTARG" ;;
    d) DETAILS="$OPTARG" ;;
    h)
      echo "用法: $0 [-s 简要总结] [-d 详细修改说明]"
      exit 0
      ;;
    \?)
      echo "无效参数，请使用 -h 查看帮助。" >&2
      exit 1
      ;;
  esac
done

echo ">>> 1. 检查并暂存代码变动..."
git add .

echo ">>> 2. 执行 Git 提交..."
# 使用两个 -m 参数，Git 会自动将第一个作为标题，第二个作为正文（Comments）
git commit -m "$SUMMARY" -m "$DETAILS"

echo ">>> 3. 更新 Docker 服务..."
docker-compose down
docker-compose up -d --build

echo ">>> 部署流程执行完毕！"
