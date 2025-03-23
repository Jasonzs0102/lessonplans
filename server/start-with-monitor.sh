#!/bin/bash
# 后端服务启动脚本 - 使用监控器以确保服务持续运行

echo "🚀 启动后端服务并附带监控..."
NODE_ENV=production node monitor.js > server.log 2>&1 &

# 记录进程ID便于后续管理
echo $! > server.pid
echo "✅ 服务已启动! 进程ID: $(cat server.pid)"
echo "日志输出重定向到 server.log"
echo "使用 'kill $(cat server.pid)' 命令停止服务"
