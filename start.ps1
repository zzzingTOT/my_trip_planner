# ============================================
#  HelloAgents Trip Planner - 一键启动脚本
# ============================================

$ErrorActionPreference = "Continue"
$Host.UI.RawUI.WindowTitle = "HelloAgents Trip Planner"

# 获取脚本所在目录（项目根目录）
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════╗"
Write-Host "  ║     HelloAgents Trip Planner - 一键启动       ║"
Write-Host "  ╚══════════════════════════════════════════════╝"
Write-Host ""

# -------------------------------
# 1. 环境检查
# -------------------------------
Write-Host "[1/5] 检查运行环境..."

# 查找可用的 Python（优先系统 Python，跳过 WindowsApps 占位符）
$pythonExe = $null
$pythonPaths = @(
    "C:\Users\Lenovo\AppData\Local\Programs\Python\Python312\python.exe",
    "C:\Python312\python.exe",
    "C:\Python311\python.exe",
    "C:\Python310\python.exe"
)
foreach ($p in $pythonPaths) {
    if (Test-Path $p) {
        $pythonExe = $p
        break
    }
}
if (-not $pythonExe) {
    $pythonExe = (Get-Command python -ErrorAction SilentlyContinue).Source
}
if (-not $pythonExe) {
    Write-Host "    [错误] 未找到 Python，请先安装 Python 3.10+" -ForegroundColor Red
    Read-Host "按 Enter 退出"
    exit 1
}

$pythonVersion = & $pythonExe --version 2>&1
Write-Host "    Python: $pythonVersion ($pythonExe)"

# 检查 Node.js
$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "    [错误] 未找到 Node.js，请先安装 Node.js 18+" -ForegroundColor Red
    Read-Host "按 Enter 退出"
    exit 1
}
Write-Host "    Node.js: $nodeVersion"

# 检查 npm
$npmVersion = npm --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "    [错误] 未找到 npm" -ForegroundColor Red
    Read-Host "按 Enter 退出"
    exit 1
}
Write-Host "    npm: v$npmVersion"

Write-Host "    √ 环境检查通过" -ForegroundColor Green

# -------------------------------
# 2. 后端依赖安装
# -------------------------------
Write-Host ""
Write-Host "[2/5] 检查后端依赖..."

Set-Location "$ProjectRoot\backend"

if (-not (Test-Path ".venv")) {
    Write-Host "    创建 Python 虚拟环境..."
    & $pythonExe -m venv .venv 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "    [错误] 虚拟环境创建失败，请检查 Python 安装" -ForegroundColor Red
        Read-Host "按 Enter 退出"
        exit 1
    }
    Write-Host "    √ 虚拟环境创建完成" -ForegroundColor Green
}

# 激活虚拟环境
$venvActivate = "$ProjectRoot\backend\.venv\Scripts\Activate.ps1"
if (Test-Path $venvActivate) {
    . $venvActivate
    Write-Host "    √ 虚拟环境已激活"
}

Write-Host "    检查 Python 依赖..."
pip install -r requirements.txt -q 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "    [警告] 部分依赖安装失败，尝试继续..." -ForegroundColor Yellow
}
Write-Host "    √ 后端依赖就绪" -ForegroundColor Green

# -------------------------------
# 3. 前端依赖安装
# -------------------------------
Write-Host ""
Write-Host "[3/5] 检查前端依赖..."

Set-Location "$ProjectRoot\frontend"

if (-not (Test-Path "node_modules")) {
    Write-Host "    安装前端依赖（首次运行可能需要几分钟）..."
    npm install 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "    [错误] 前端依赖安装失败" -ForegroundColor Red
        Read-Host "按 Enter 退出"
        exit 1
    }
}
Write-Host "    √ 前端依赖就绪" -ForegroundColor Green

# -------------------------------
# 4. 检查环境变量
# -------------------------------
Write-Host ""
Write-Host "[4/5] 检查环境变量配置..."

if (-not (Test-Path "$ProjectRoot\backend\.env")) {
    Write-Host "    [警告] backend\.env 不存在，请复制 .env.example 并填写配置" -ForegroundColor Yellow
}

if (-not (Test-Path "$ProjectRoot\frontend\.env")) {
    Write-Host "    [警告] frontend\.env 不存在，请复制 .env.example 并填写配置" -ForegroundColor Yellow
}
Write-Host "    √ 环境变量检查完成" -ForegroundColor Green

# -------------------------------
# 5. 启动服务
# -------------------------------
Write-Host ""
Write-Host "[5/5] 启动服务..."
Write-Host ""
Write-Host "  ┌─────────────────────────────────────────────┐"
Write-Host "  │  后端服务: http://localhost:8000              │"
Write-Host "  │  API 文档: http://localhost:8000/docs         │"
Write-Host "  │  前端页面: http://localhost:5173              │"
Write-Host "  └─────────────────────────────────────────────┘"
Write-Host ""

# 启动后端
Write-Host "    启动后端服务..."
$backendCmd = "Set-Location '$ProjectRoot\backend'; .\.venv\Scripts\Activate.ps1; Write-Host '后端服务启动中...'; python run.py; Read-Host"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd -WindowStyle Normal

# 等待后端启动
Write-Host "    等待后端服务启动（3秒）..."
Start-Sleep -Seconds 3

# 启动前端
Write-Host "    启动前端服务..."
$frontendCmd = "Set-Location '$ProjectRoot\frontend'; Write-Host '前端服务启动中...'; npm run dev; Read-Host"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd -WindowStyle Normal

Write-Host ""
Write-Host "  √ 服务已启动！请查看弹出的两个 PowerShell 窗口。" -ForegroundColor Green
Write-Host ""
Write-Host "  关闭本窗口不会影响服务运行。"
Write-Host "  要停止服务，请分别关闭两个服务窗口。"
Write-Host ""

Read-Host "按 Enter 退出"
