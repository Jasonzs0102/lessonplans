#!/bin/bash
set -e

echo "🚀 开始部署流程..."

# 前端部署部分
echo "📦 准备前端部署..."

# 导航到客户端目录
cd client

# 安装依赖
echo "⏳ 安装前端依赖..."
npm install

# 创建生产环境变量文件 - 指向已部署的Cloudflare Worker API
echo "⚙️ 配置生产环境变量..."
echo "VITE_API_BASE_URL=https://api.lessonplan-app.com/api" > .env.production

# 构建项目
echo "🔨 构建前端项目..."
npm run build

# GitHub推送部分 (如果需要手动推送)
# 如果已设置GitHub Actions自动部署，此步骤可省略
echo "✅ 前端构建完成！请确保已将更改推送到GitHub，Cloudflare Pages将自动部署。"

# 返回项目根目录
cd ..

# 后端部署部分
echo "📦 准备后端Worker部署..."

# 导航到server-worker目录
cd server-worker

# 安装依赖
echo "⏳ 安装后端Worker依赖..."
npm install

# 使用Wrangler部署
echo "🚀 使用Wrangler部署后端Worker..."
npx wrangler deploy

echo "✅ 全部部署完成！"
echo "前端: 已构建，等待GitHub自动部署或手动推送"
echo "后端: 已使用Wrangler部署到Cloudflare Workers"
