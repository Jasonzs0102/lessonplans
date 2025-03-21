#!/bin/bash

# 导航到客户端目录
cd client

# 安装依赖
npm install

# 创建生产环境变量文件 - 这里使用您的API接口
echo "VITE_API_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1" > .env.production

# 构建项目
npm run build

# 构建完成提示
echo "✅ 构建完成！现在可以部署 ./client/dist 目录到 Cloudflare Pages"
