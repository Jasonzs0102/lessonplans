#!/bin/bash
set -e

echo "🔍 开始优化并部署到Cloudflare..."

# 确保worker配置最佳实践
echo "⚙️ 优化Worker配置..."

# 导航到worker目录
cd server-worker

# 检查并创建wrangler.toml配置
if [ -f "wrangler.toml" ]; then
    # 备份当前配置
    cp wrangler.toml wrangler.toml.bak
    
    echo "📝 更新Worker配置..."
    cat > wrangler.toml << EOL
name = "ai-lessonplan-api"
main = "src/index.js"
compatibility_date = "2023-12-01"
compatibility_flags = ["nodejs_compat"]

# 增加超时时间和内存限制
[vars]
AI_API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
AI_MODEL_NAME = "qwq-plus"
NODE_ENV = "production"

# 环境变量通过Cloudflare界面设置
# AI_API_KEY = "your-api-key-here"

[[routes]]
pattern = "api.lessonplan-app.com"
custom_domain = true

# 增加资源限制
[limits]
cpu_ms = 150
memory_mb = 256
logs_per_second = 20

# 增加处理时间限制
[handlers]
max_duration = 90
EOL
    echo "✅ Worker配置已更新"
else
    echo "❌ 未找到wrangler.toml配置文件"
    exit 1
fi

# 更新package.json以确保有正确的依赖
echo "📦 检查依赖..."
if [ -f "package.json" ]; then
    # 确保有正确的依赖
    npm install --save undici@5.28.3
    echo "✅ 依赖已安装"
else
    echo "❌ 未找到package.json"
    exit 1
fi

# 回到主目录
cd ..

# 更新前端配置
echo "⚙️ 优化前端配置..."
cd client

# 更新环境变量
echo "VITE_API_BASE_URL=https://api.lessonplan-app.com/api" > .env.production
echo "VITE_NODE_ENV=production" >> .env.production

# 优化vite配置
echo "📝 更新Vite配置..."
cat > vite.config.ts << EOL
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: { overlay: false },
    watch: {
      usePolling: false,
    },
    open: true,
  },
  build: {
    cssMinify: true,
    minify: 'esbuild',
    sourcemap: false,
    // 添加兼容性设置
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['framer-motion', 'react-markdown']
        }
      }
    }
  },
})
EOL
echo "✅ Vite配置已更新"

# 构建前端
echo "🔨 构建前端..."
npm run build
echo "✅ 前端构建完成"

# 回到主目录
cd ..

# 部署Worker
echo "🚀 部署优化后的Worker..."
cd server-worker
npx wrangler deploy
echo "✅ Worker部署完成"

echo "🎉 优化部署完成！"
echo "前端: 已构建，请手动推送到GitHub或Cloudflare Pages"
echo "后端: 已部署到Cloudflare Workers"
echo ""
echo "⚠️ 重要提示:"
echo "1. 请在Cloudflare Workers界面设置环境变量 AI_API_KEY"
echo "2. 确保Cloudflare Workers的触发器设置正确"
echo "3. 检查域名解析是否正确指向Cloudflare"
echo ""
echo "✅ 优化内容:"
echo "1. 按钮防抖保护：已添加前端防抖处理，防止重复点击"
echo "2. 请求监控：已添加IP监控和请求计数，帮助排查问题"
echo "3. 自动报警：当一个IP短时间内请求频繁时，会自动记录警告日志"
echo "4. 资源配置：已增加Worker的内存和CPU限制，提高稳定性" 