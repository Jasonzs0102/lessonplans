#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}正在启动AI体育教案生成系统...${NC}"

# 设置开发环境变量
export NODE_ENV=development

# 输出开发环境提示
echo -e "${YELLOW}⚠️ 启动模式: 开发环境${NC}"
echo -e "${YELLOW}ℹ️ 已禁用API请求频率限制${NC}"

# 启动后端服务
echo -e "${GREEN}启动后端服务...${NC}"
cd server && NODE_ENV=development node --no-warnings index.js &
SERVER_PID=$!

# 等待后端服务启动
sleep 2

# 启动前端服务
echo -e "${GREEN}启动前端服务...${NC}"
cd ../client && VITE_NODE_ENV=development npm run fast &
CLIENT_PID=$!

# 输出访问地址
echo ""
echo -e "${BLUE}==============================================${NC}"
echo -e "${GREEN}AI体育教案生成系统已启动!${NC}"
echo -e "${GREEN}后端API: http://localhost:5001${NC}"
echo -e "${GREEN}前端界面: http://localhost:5173${NC}"
echo -e "${BLUE}==============================================${NC}"
echo ""
echo -e "${YELLOW}调试信息:${NC}"
echo -e "- ${YELLOW}已禁用请求频率限制${NC}"
echo -e "- ${YELLOW}已启用API请求监控${NC}"
echo -e "- ${YELLOW}按钮点击已添加防抖保护${NC}"
echo ""
echo -e "按 ${BLUE}Ctrl+C${NC} 停止所有服务"

# 处理退出信号
trap "kill $SERVER_PID $CLIENT_PID; exit" INT TERM

# 等待子进程
wait 