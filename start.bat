@echo off
REM 云文档 AI 翻译平台 - 完整启动脚本 (Windows)

setlocal enabledelayedexpansion

echo.
echo ================================
echo 云文档 AI 翻译平台 启动脚本
echo ================================
echo.

REM 颜色定义（需要 Windows 10+）
set "INFO=[信息]"
set "SUCCESS=[成功]"
set "ERROR=[错误]"
set "WARN=[警告]"

echo %INFO% 启动项目前置检查...
echo.

REM 检查 Node.js
node --version >nul 2>&1
if !errorlevel! neq 0 (
    echo %ERROR% Node.js 未安装或不在 PATH 中
    echo 请从 https://nodejs.org 下载并安装 Node.js 18+
    pause
    exit /b 1
)

echo %SUCCESS% Node.js 已安装

REM 检查 Docker
docker --version >nul 2>&1
if !errorlevel! neq 0 (
    echo %WARN% Docker 未安装 (可选)
    echo 如需数据库，请安装 Docker: https://docker.com
) else (
    echo %SUCCESS% Docker 已安装
)

echo.
echo ================================
echo 启动步骤
echo ================================
echo.

REM 启动数据库（如果有 Docker）
docker ps >nul 2>&1
if !errorlevel! equ 0 (
    echo %INFO% 启动 PostgreSQL 和 Redis...
    docker-compose up -d
    if !errorlevel! equ 0 (
        echo %SUCCESS% 数据库启动成功
        echo   - PostgreSQL: localhost:5432
        echo   - Redis: localhost:6379
        echo   - Adminer: http://localhost:8080
    ) else (
        echo %WARN% 数据库启动失败，继续启动前端
    )
    echo.
)

REM 启动前端
echo %INFO% 启动前端应用...
cd frontend

if not exist "node_modules" (
    echo %INFO% 安装前端依赖...
    call npm install
)

echo.
echo ================================
echo 前端已启动
echo ================================
echo 📱 访问地址: http://localhost:3000
echo.
echo 其他服务:
echo   - API 文档: http://localhost:3001/api (后端启动后)
echo   - 数据库管理: http://localhost:8080
echo.
echo 按 Ctrl+C 停止服务
echo ================================
echo.

call npm run dev

pause
