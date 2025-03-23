#!/bin/bash
set -e

echo "🚀 开始部署流程..."

# 部署方式选择
echo "请选择前端部署方式:"
echo "1) 通过GitHub Actions自动部署"
echo "2) 直接使用wrangler部署"
read -p "请输入选项(1/2): " frontend_deploy_option

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

if [ "$frontend_deploy_option" = "1" ]; then
  # GitHub部署选项
  echo "✅ 前端构建完成！"
  echo "请确保您的GitHub仓库已连接到Cloudflare Pages并配置好自动部署流程。"
  echo "将更改推送到GitHub，Cloudflare Pages将自动部署。"
  
  read -p "是否要提交并推送到GitHub? (y/n): " push_to_github
  if [ "$push_to_github" = "y" ]; then
    read -p "请输入提交信息: " commit_message
    git add .
    git commit -m "$commit_message"
    git push
    echo "✅ 已推送到GitHub，等待Cloudflare Pages自动部署..."
  fi
  
elif [ "$frontend_deploy_option" = "2" ]; then
  # Wrangler直接部署选项
  echo "📦 准备使用Wrangler部署前端..."
  
  # 检查是否已安装wrangler
  if ! command -v npx &> /dev/null; then
    echo "❌ 错误: 未找到npx命令，请确保已安装Node.js和npm"
    exit 1
  fi
  
  # 创建临时的wrangler.toml配置
  echo "⚙️ 创建Wrangler配置..."
  cat > wrangler.toml << EOL
name = "lessonplan-frontend"
main = "./dist"
compatibility_date = "2023-03-21"
site = { bucket = "./dist" }

# 添加自定义域名配置（如果需要）
# [[routes]]
# pattern = "lessonplan-app.com/*"
# zone_name = "lessonplan-app.com"
EOL

  # 使用Wrangler部署
  echo "🚀 使用Wrangler部署前端..."
  npx wrangler pages deploy dist
  
  # 删除临时配置
  rm -f wrangler.toml
  
  echo "✅ 前端已使用Wrangler部署"
fi

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
if [ "$frontend_deploy_option" = "1" ]; then
  echo "前端: 已构建，已提交到GitHub，等待Cloudflare Pages自动部署"
else
  echo "前端: 已使用Wrangler直接部署"
fi
echo "后端: 已使用Wrangler部署到Cloudflare Workers"

# 显示部署信息
echo "🌐 部署信息:"
echo "前端URL: https://lessonplan-app.com"
echo "后端API: https://api.lessonplan-app.com/api"
echo ""
echo "别忘了更新您的个人联系邮箱: 13335930102wzs@gmail.com"
