#!/usr/bin/env bash
# 语界 LinguaVerse · 开发服务器
# 用法:
#   ./scripts/dev-server.sh        # 默认跑 v2 在 8080
#   ./scripts/dev-server.sh v1     # 跑 v1 在 8080
#   ./scripts/dev-server.sh v2 9000# 跑 v2 在 9000
set -e
VER=${1:-v2}
PORT=${2:-8080}
DIR="$VER"
if [ ! -d "$DIR" ]; then echo "目录 $DIR 不存在,请在仓库根目录运行"; exit 1; fi
echo "🐍 启动语界 LinguaVerse 【${VER}】 开发服务器"
echo "   URL:  http://localhost:${PORT}/"
echo "   目录: $(pwd)/$DIR"
echo "   Ctrl+C 退出"
python3 -m http.server "$PORT" --directory "$DIR"
