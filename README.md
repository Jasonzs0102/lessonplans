# AI体育教案生成系统

## 项目简介

这是一个基于AI技术的体育教案生成系统，帮助教师快速创建高质量的教学计划。系统采用前后端分离架构，前端使用React + TypeScript + Tailwind CSS构建，后端使用Node.js + Express实现。

## 本地开发环境设置

### 前置要求
- Node.js 18.x 或更高版本
- npm 9.x 或更高版本

### 克隆项目
```bash
git clone https://github.com/Jasonzs0102/lessonplans.git
cd lessonplans
```

### 环境配置

1. 后端配置
```bash
cd server
cp .env.example .env
```
编辑 `server/.env` 文件，配置以下内容：
```
PORT=5001
NODE_ENV=development

# AI API配置
AI_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
AI_API_KEY=your_api_key_here
AI_MODEL_NAME=qwq-plus

# 飞书集成配置（可选）
ENABLE_FEISHU_EXPORT=false
FEISHU_APP_ID=your_app_id_here
FEISHU_APP_SECRET=your_app_secret_here
FEISHU_BASE_ID=your_base_id_here
FEISHU_TABLE_ID=your_table_id_here
```

2. 前端配置
```bash
cd ../client
cp .env.example .env
```
编辑 `client/.env` 文件，配置以下内容：
```
# 后端API服务的基础URL
VITE_API_BASE_URL=http://localhost:5001/api
```

### 安装依赖

1. 安装后端依赖
```bash
cd server
npm install
```

2. 安装前端依赖
```bash
cd ../client
npm install
```

### 启动服务

1. 启动后端服务
```bash
cd server
npm run dev
```
后端服务将在 http://localhost:5001 运行

2. 启动前端服务
```bash
cd client
npm run dev
```
前端服务将在 http://localhost:3000 运行

## 项目结构

```
lessonplans/
├── client/                 # 前端项目
│   ├── src/               # 源代码
│   ├── public/            # 静态资源
│   └── package.json       # 前端依赖配置
├── server/                # 后端项目
│   ├── src/              # 源代码
│   ├── routes/           # 路由定义
│   ├── controllers/      # 控制器
│   └── package.json      # 后端依赖配置
└── README.md             # 项目说明文档
```

## 主要功能

- 教案参数收集
- AI教案生成
- 实时预览
- 飞书表格导出（可选）
- 多语言支持

## 技术栈

### 前端
- React 18
- TypeScript
- Tailwind CSS 3.4.1
- Framer Motion
- React Query
- React Hook Form

### 后端
- Node.js
- Express
- Zod
- Winston
- Express Rate Limit

## 开发说明

### 代码规范
- 使用 ESLint 进行代码检查
- 使用 TypeScript 进行类型检查
- 遵循 React Hooks 最佳实践

### 提交规范
- feat: 新功能
- fix: 修复问题
- docs: 文档修改
- style: 代码格式修改
- refactor: 代码重构
- test: 测试用例修改
- chore: 其他修改

## 许可证

ISC