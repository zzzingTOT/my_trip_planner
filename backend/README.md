# 后端服务模块 backend
技术栈：Python + FastAPI + LLM Agent

## 目录结构
- app：核心业务逻辑
  - agent：旅行规划智能体
  - routes：接口路由（行程、地图健康检查）
- run.py：项目启动入口
- .env：密钥环境配置（本地私有，不上传）
- requirements.txt：Python依赖包

## 启动方式
1. 安装依赖：pip install -r requirements.txt
2. 配置.env中的大模型密钥、地图key
3. 执行 python run.py 启动服务
4. 访问 http://127.0.0.1:8000/docs 打开Swagger接口文档
