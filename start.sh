#!/bin/bash

# 云文档 AI 翻译平台 - 完整启动脚本 (Linux/Mac)

echo ""
echo "================================"
echo "云文档 AI 翻译平台 启动脚本"
echo "================================"
echo ""

# 颜色定义
INFO="\033[0;36m[信息]\033[0m"
SUCCESS="\033[0;32m[成功]\033[0m"
ERROR="\033[0;31m[错误]\033[0m"
WARN="\033[0;33m[警告]\033[0m"

echo -e "$INFO 启动项目前置检查..."
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "$ERROR Node.js 未安装"
    echo "请从 https://nodejs.org 下载并安装 Node.js 18+"
    exit 1
fi

echo -e "$SUCCESS Node.js 已安装 ($(node --version))"

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo -e "$WARN Docker 未安装 (可选)"
    echo "如需数据库，请安装 Docker: https://docker.com"
else
    echo -e "$SUCCESS Docker 已安装 ($(docker --version))"
fi

echo ""
echo "================================"
echo "启动步骤"
echo "================================"
echo ""

# 启动数据库（如果有 Docker）
if command -v docker &> /dev/null; then
    echo -e "$INFO 启动 PostgreSQL 和 Redis..."
    docker-compose up -d
    if [ $? -eq 0 ]; then
        echo -e "$SUCCESS 数据库启动成功"
        echo "  - PostgreSQL: localhost:5432"
        echo "  - Redis: localhost:6379"
        echo "  - Adminer: http://localhost:8080"
    else
        echo -e "$WARN 数据库启动失败，继续启动前端"
    fi
    echo ""
fi

# 启动前端
echo -e "$INFO 启动前端应用..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo -e "$INFO 安装前端依赖..."
    npm install
fi

echo ""
echo "================================"
echo "前端已启动"
echo "================================"
echo "📱 访问地址: http://localhost:3000"
echo ""
echo "其他服务:"
echo "  - API 文档: http://localhost:3001/api (后端启动后)"
echo "  - 数据库管理: http://localhost:8080"
echo ""
echo "按 Ctrl+C 停止服务"
echo "================================"
echo ""

npm run dev
