# 部署到Cloudflare指南

本项目可以通过多种方式部署到Cloudflare。以下是详细的部署指南。

## 前端部署

### 选项1：通过GitHub Actions自动部署（推荐）

1. 确保您的GitHub仓库已连接到Cloudflare Pages
   - 登录到Cloudflare Dashboard
   - 进入Pages部分
   - 点击"创建应用程序"
   - 选择"连接到Git"
   - 授权并选择您的GitHub仓库

2. 设置必要的GitHub Secrets
   - 在GitHub仓库设置中，添加以下secrets：
     - `CLOUDFLARE_API_TOKEN`：您的Cloudflare API令牌
     - `CLOUDFLARE_ACCOUNT_ID`：您的Cloudflare账户ID

3. 推送代码到GitHub
   ```bash
   git add .
   git commit -m "更新部署"
   git push
   ```

4. GitHub Actions将自动构建并部署您的应用

### 选项2：使用Wrangler CLI直接部署

1. 在客户端目录中构建并部署
   ```bash
   cd client
   npm run build
   npx wrangler pages deploy dist
   ```

2. 或者使用我们预设的脚本
   ```bash
   cd client
   npm run deploy
   ```

## 后端部署

后端Worker使用Wrangler部署：

1. 部署到Cloudflare Workers
   ```bash
   cd server-worker
   npm install
   npx wrangler deploy
   ```

## 一键部署（前端+后端）

使用我们的一键部署脚本：

```bash
chmod +x deploy-to-cloudflare.sh
./deploy-to-cloudflare.sh
```

按照提示选择部署方式，脚本将自动完成所有部署步骤。

## 自定义域名

1. 在Cloudflare Dashboard中为您的Pages项目和Worker设置自定义域名
2. 更新环境变量中的API基础URL指向您的Worker域名
3. 如果需要，编辑wrangler.toml文件中的路由配置

## 联系信息

如果您在部署过程中遇到任何问题，请联系：
- 邮箱：13335930102wzs@gmail.com
- 请在联系时注明具体来意

## 注意事项

- 确保Cloudflare API令牌具有Pages和Workers的权限
- 前端部署后请验证API连接是否正常
- 如果您更改了API URL，记得更新前端的环境变量 