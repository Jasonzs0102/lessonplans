#!/bin/bash

# 导航到客户端目录
cd client

# 安装依赖
npm install

# 创建生产环境变量文件 - 指向已部署的Cloudflare Worker API
echo "VITE_API_BASE_URL=https://lessonplan-backend.13335930102wzs.workers.dev" > .env.production

# 构建项目
npm run build

# 创建缓存设置文件
echo '{
  "headers": [
    {
      "source": "/assets/*",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)\\.(?:json|xml|css|js|jpg|jpeg|gif|png|ico|svg|webp|mp4|webm)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=86400"
        }
      ]
    }
  ]
}' > ./dist/_headers

# 构建完成提示
echo "✅ 构建完成！缓存设置已添加。现在可以部署 ./client/dist 目录到 Cloudflare Pages"
