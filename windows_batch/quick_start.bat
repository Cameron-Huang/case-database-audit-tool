@echo off
REM quick_start.bat
REM Windows 一键启动脚本

setlocal enabledelayedexpansion

REM 颜色定义
color 0A

echo.
echo ========================================
echo   案例数据库审核工具 - 快速启动
echo ========================================
echo.

set BASE_DIR=D:\AI\project\0409
set DATABASE_VERSION=case_database_21_batch11_expanded

REM 检查Node.js
echo [检查] Node.js 环境...
where node >nul 2>nul
if errorlevel 1 (
  echo ❌ 错误：未找到 Node.js
  echo.
  echo 请先安装 Node.js (https://nodejs.org)
  echo.
  pause
  exit /b 1
)
echo ✅ Node.js 已找到

echo.
echo ========================================
echo   选择操作
echo ========================================
echo.
echo 1. 生成审核清单
echo 2. 应用修改
echo 3. 查看帮助
echo 0. 退出
echo.

set /p choice="请选择 [0-3]: "

if "%choice%"=="1" goto generate
if "%choice%"=="2" goto apply
if "%choice%"=="3" goto help
if "%choice%"=="0" exit /b 0

echo ❌ 无效选择
goto :EOF

:generate
echo.
echo 📝 生成审核清单...
node scripts/1_generate_audit_checklist.mjs "%BASE_DIR%\%DATABASE_VERSION%\02_indexes\case_database_index.csv"
pause
goto :EOF

:apply
echo.
echo 🔄 应用修改...
node scripts/2_apply_audit_changes.mjs "%BASE_DIR%\00_audit_checklist.csv" "%BASE_DIR%\%DATABASE_VERSION%\02_indexes\case_database_index.csv"
pause
goto :EOF

:help
echo.
echo 📖 使用说明
echo.
echo 工作流：
echo   1. 点击选项1生成审核清单
echo   2. 用 WPS Excel 打开 00_audit_checklist.csv
echo   3. 逐行检查和修改
echo   4. 保存文件
echo   5. 点击选项2应用修改
echo.
echo 修改格式：
echo   把XXX改为YYY
echo.
echo 示例：
echo   把"噪声影响"改为"环保问题"
echo.
pause
goto :EOF
