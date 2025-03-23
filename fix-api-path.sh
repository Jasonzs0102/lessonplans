#!/bin/bash
set -e

# 设置颜色
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}开始修复API路径问题...${NC}"

# 修复本地环境变量
echo -e "${GREEN}更新本地开发环境变量...${NC}"
cd client
echo "VITE_API_BASE_URL=http://localhost:5001/api" > .env
echo "VITE_NODE_ENV=development" >> .env

# 修复生产环境变量
echo -e "${GREEN}更新生产环境变量...${NC}"
echo "VITE_API_BASE_URL=https://api.lessonplan-app.com/api" > .env.production
echo "VITE_NODE_ENV=production" >> .env.production

# 重新构建前端
echo -e "${GREEN}重新构建前端代码...${NC}"
npm run build
echo -e "${GREEN}✅ 前端构建完成${NC}"

# 返回项目根目录
cd ..

# 修复完成提示
echo ""
echo -e "${BLUE}==============================================${NC}"
echo -e "${GREEN}API路径修复完成!${NC}"
echo -e "${BLUE}==============================================${NC}"
echo ""
echo -e "${YELLOW}修复内容:${NC}"
echo -e "1. ${YELLOW}修复了环境变量配置，确保API基础URL包含/api前缀${NC}"
echo -e "2. ${YELLOW}更新了API请求逻辑，自动处理路径重复问题${NC}"
echo -e "3. ${YELLOW}添加了路径智能检测，兼容多种部署环境${NC}"
echo ""
echo -e "${YELLOW}后续部署步骤:${NC}"
echo -e "1. ${YELLOW}使用./optimize-cloudflare-deploy.sh脚本部署到Cloudflare${NC}"
echo -e "2. ${YELLOW}或使用./quick-start.sh在本地开发环境运行${NC}"
echo ""
echo -e "${RED}记得将修复后的代码推送到代码仓库!${NC}" 