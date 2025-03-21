#!/bin/bash

# 导航到客户端目录
cd client

# 安装依赖
npm install

# 创建生产环境变量文件 - 指向将要部署的Cloudflare Worker API
echo "VITE_API_BASE_URL=https://api.lessonplan-app.com/api" > .env.production

# 构建项目
npm run build

# 构建完成提示
echo "✅ 构建完成！现在可以部署 ./client/dist 目录到 Cloudflare Pages"
