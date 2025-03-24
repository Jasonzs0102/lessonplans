#!/bin/bash

# 颜色
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # 重置颜色

echo -e "${BLUE}===== 开始部署 lessonplans.pro =====${NC}"

# 1. 构建前端
echo -e "${GREEN}构建前端项目...${NC}"
cd ../client && npm run build

if [ $? -ne 0 ]; then
  echo "前端构建失败，请检查错误"
  exit 1
fi

echo "前端构建成功！"

# 2. 输入敏感环境变量
echo -e "${GREEN}设置敏感环境变量...${NC}"
cd ../worker

echo -e "准备设置 AI_API_KEY 环境变量..."
wrangler secret put AI_API_KEY

echo -e "准备设置飞书 App ID 环境变量..."
wrangler secret put FEISHU_APP_ID

echo -e "准备设置飞书 App Secret 环境变量..."
wrangler secret put FEISHU_APP_SECRET

echo -e "准备设置飞书 Base ID 环境变量..."
wrangler secret put FEISHU_BASE_ID

echo -e "准备设置飞书 Table ID 环境变量..."
wrangler secret put FEISHU_TABLE_ID

# 3. 部署到Cloudflare
echo -e "${GREEN}部署到 Cloudflare Workers...${NC}"

echo "使用 npx wrangler 部署..."
npx wrangler deploy

if [ $? -ne 0 ]; then
  echo "部署失败，请检查错误"
  exit 1
fi

echo -e "${BLUE}===== 部署完成！=====${NC}"
echo -e "可通过 https://lessonplans.pro 访问服务" 