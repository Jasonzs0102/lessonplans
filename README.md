# AI体育教案生成系统 - 项目说明文档

## 一、执行摘要

本项目旨在开发一个基于AI技术的体育教案生成网站，帮助教师高效创建高质量的教学计划。该系统通过用户友好的界面收集教学参数，利用先进的AI模型生成标准化、个性化的教案，并提供多种格式的导出选项。本系统采用前后端分离架构，确保高可靠性、可扩展性和用户体验。前端采用Apple设计风格，提供现代化、简洁优雅的用户界面。

## 二、项目概述

### 2.1 项目背景与目标
教师在准备教案时常常面临时间紧张和资源有限的挑战。AI技术的发展为解决这一问题提供了可能性，通过智能化工具辅助教师高效创建专业教案。

### 2.2 目标用户
- 体育在职教师
- 体育教研员
- 体育教学专业学生

### 2.3 核心价值主张
- 节省教师备课时间
- 提供标准化、高质量的教案框架
- 支持个性化教学需求
- 促进教学经验分享

## 三、简化流程说明

### 3.1. 参数采集模块
- **核心功能**：收集用户输入的教学参数（年级、课程时长、运动项目、学生人数、教学内容和补充要求）
- **实现方式**：React表单组件，向导式设计，支持参数保存
- **简化处理**：去除复杂的用户管理，仅保留核心参数收集功能

### 3.2. 参数验证与处理
- **核心功能**：验证参数并注入提示词模板
- **实现方式**：Zod进行验证，将验证后的参数注入到promptTemplate.js中的模板
- **简化处理**：将多层验证简化为单一验证流程

### 3.3. AI调用模块
- **核心功能**：调用AI生成教案
- **实现方式**：使用OpenAI兼容SDK调用阿里云QWQ API，具体实现方法参考[api_use_example.md](./api_use_example.md)
- **关键特性**：流式响应处理，实时显示生成结果
- **简化处理**：专注于阿里云QWQ API的稳定集成

### 3.4. 结果处理与展示
- **核心功能**：展示AI生成的教案并提供下载功能；展示最终的完整的教案内容
- **实现方式**：React Markdown渲染，支持复制、编辑、保存和下载
- **简化处理**：优先实现Markdown渲染和复制功能，下载功能可后续添加
- **暂存处理**：不在项目中建数据库，而是直接将生成的教案内容发送到飞书多维表格中

### 3.5. 飞书表格集成（外部数据库）
- **核心功能**：将生成后的完整教案自动插入到飞书表格，具体实现方法参考[plans2feishu.md](./plans2feishu.md)
- **实现方式**：调用飞书API，使用配置的凭证进行表格操作
- **简化处理**：可作为独立模块，不影响主流程
- **后续实现**：将完整教案内容分成9个部分，分别发送到飞书多维表格的不同字段中（基本信息、学习目标、主要教学内容、重难点、安全保障、场地器材、课的结构、预计负荷、反思要点），实现数据的结构化存储和管理。

## 四、技术栈与实现方案
### 4.1 前端技术栈
- **React 18**：提供高效的UI渲染和组件化架构
- **TypeScript**：提供类型安全保障
- **React Query**：优化API状态管理和缓存
- **Tailwind CSS 3.4.1**：快速构建响应式UI（注意：项目不兼容Tailwind CSS v4，tailwind.config.js必须使用CommonJS模块语法`module.exports`而非ES模块语法`export default`）
- **Framer Motion**：提供流畅的动画和交互效果
- **Vite**：提供快速的开发环境和构建工具
- **React Markdown**：用于Markdown渲染
- **React Hook Form**：表单状态管理与验证

### 4.2 后端技术栈
- **Node.js 18 + Express.js**：构建可靠的API服务
- **Zod**：严格的输入验证与类型生成
- **OpenAI SDK**：API调用封装
- **Winston**：日志管理
- **Express Rate Limit**：API限流实现
- **Node-cache**：内存缓存实现

### 4.3 数据存储方案
- **首期实现**：简化版不包含持久化存储，仅使用内存缓存
- **后期规划**：集成MongoDB存储用户信息和教案数据，Redis作为缓存层

## 五、API调用与集成

### 5.1 API接口设计

#### 教案生成接口
- **方法**：POST
- **路径**：/api/generate
- **请求体**：包含所有教学参数
- **响应**：生成的教案内容

#### 健康检查接口
- **方法**：GET
- **路径**：/api/health
- **响应**：服务状态信息

### 5.2 阿里云API集成说明

- **API地址**: https://dashscope.aliyuncs.com/compatible-mode/v1
- **模型名称**: qwq-plus
- **调用方式**: 流式输出（Stream）

**重要说明**:
- QwQ模型**仅支持流式输出**方式调用
- 不支持以下功能：工具调用、结构化输出、前缀续写、上下文缓存
- 不支持以下参数：temperature、top_p、presence_penalty、frequency_penalty等
- 设置这些参数不会生效，即使没有错误提示
- 为达到模型最佳推理效果，不建议设置System Message

### 5.3 API调用流程

1. 收集用户输入的教学参数
2. 生成提示词（Prompt）模板
3. 使用OpenAI SDK调用阿里云API
4. 处理流式响应数据
5. 呈现生成的教案内容

## 六、部署与运维

### 6.1 服务器要求
- Node.js 16.x 或更高版本
- 5001端口开放（可在server/.env修改PORT）
- 阿里云API调用权限

### 6.2 安装与配置

#### 环境变量配置
复制server/.env.example为server/.env并配置：
```bash
cp server/.env.example server/.env
```

在服务器端`.env`文件中配置以下环境变量：
```
PORT=5001
AI_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
AI_API_KEY=your-api-key
AI_MODEL_NAME=qwq-plus
```

在客户端`.env`文件中配置API基础URL：
```
VITE_API_BASE_URL=http://localhost:5001
```

#### 安装依赖
```bash
cd server && npm install
cd ../client && npm install
```

### 6.3 启动服务

#### 开发模式
启动后端服务：
```bash
cd server && npm run dev
```

启动前端开发服务器：
```bash
cd client && npm run dev
```

默认情况下，前端开发服务器会在 http://localhost:5173 启动，后端API服务器在 http://localhost:5001 启动。

#### 生产模式
构建前端代码：
```bash
cd client && npm run build
```

启动生产环境服务：
```bash
cd server && npm start
```

### 6.4 安全注意事项
- 切勿将.env文件提交到版本控制
- 生产环境应配置防火墙规则，仅开放必要端口
- API密钥需定期轮换
- 用户数据传输使用HTTPS加密
- 实现CSRF防护

## 七、Prompt模板设计
系统预设了专业的Prompt模板（见promptTemplate.js），以确保生成高质量的教案。模板设计考虑以下因素：
- 符合教育标准和课程要求
- 包含教学目标、活动设计、教学资源等要素
- 支持多样化的教学方法
- 适应不同年级和能力水平

### Prompt模板使用示例
```javascript
// 使用示例
const { generatePrompt } = require('./utils/promptTemplate');

const userParams = {
  grade: '二年级',
  duration: '40',
  sportType: '篮球',
  studentCount: '30',
  teachingContent: '基础篮球技能',
  requirements: '注重趣味性'
};

const prompt = generatePrompt(userParams);
// 接下来使用prompt调用AI API


## 八、设计说明

### 9.1 用户界面设计

本项目采用了Apple设计风格，具有以下特点：

- **简洁优雅**：界面设计简洁明了，减少视觉干扰
- **响应式布局**：适应不同设备和屏幕尺寸
- **优雅过渡动画**：表单提交后，界面会优雅地转换为分栏布局
- **精致细节**：圆角、阴影、过渡效果等精心设计的细节
- **专业色彩方案**：使用专业的配色方案，提升用户体验

### 9.2 交互特点

- **流畅的表单体验**：表单输入过程中提供即时反馈
- **动态布局切换**：根据用户操作动态调整界面布局
- **精美加载动画**：在AI生成教案时提供视觉反馈
- **结果即时呈现**：生成的教案内容实时显示，支持Markdown格式
- **便捷的结果处理**：提供复制和下载功能，方便用户操作

### 9.3 技术亮点

- **Framer Motion动画**：使用Framer Motion库实现流畅的界面动画
- **Tailwind CSS响应式设计**：使用Tailwind CSS 3.4.1构建响应式界面
- **组件化架构**：采用React组件化设计，提高代码复用性和可维护性
- **流式响应处理**：采用流式响应技术，实时展示AI生成结果
- **优化的移动端体验**：为移动设备优化的布局和交互


## 九、项目文件说明

本项目包含以下关键文件，各自有不同的用途和使用方式：

### 9.1 核心开发文件

#### promptTemplate.js
**用途**：教案生成的提示词模板，定义了发送给AI的指令格式。

**使用方式**：
- 在后端服务中导入此模块
- 通过注入用户参数生成完整的提示词
- 将生成的提示词用于调用AI API

#### api_use_example.md
**用途**：提供兼容OpenAI接口的不同AI API的调用示例，包括阿里云QWQ和火山方舟的DeepSeek R1。

**使用方式**：
- 在开发API调用代码时参考此示例
- 根据主备API切换策略实现多个API的整合

#### plans2feishu.md
**用途**：飞书表格集成模块，实现将生成的教案内容自动发送到飞书多维表格。

**使用方式**：
- 将其中的代码部分提取为`feishuExport.js`模块
- 在教案生成后调用`exportLessonToFeishu`函数

### 8.2 开发指南与规范

#### AI_Coding_web_Rules.md
**用途**：开发规范指南，定义了网页开发的规范和最佳实践。

**使用方式**：
- 在开发过程中遵循这些规范
- 确保代码质量和一致性
- 指导前端开发流程和打包发布过程

## 九、后续开发计划

### 9.1 核心功能完善
- 优化阿里云QWQ API调用效率
- 添加教案导出为多种格式的功能
- 优化前端用户体验和响应速度

### 9.2 扩展功能
- 开发移动应用，提供更便捷的移动端体验
- 增加教案分享社区功能，促进教师间交流
- 提供教案智能评估功能，帮助提升教案质量
- 集成更多教育资源库，丰富教案内容

### 9.3 性能与安全优化
- 增强系统监控与日志功能
- 提升服务器可用性与容灾能力
- 强化数据安全与用户隐私保护

## GitHub Actions 部署配置

为了使用GitHub Actions自动部署到Cloudflare Pages，需要在GitHub仓库设置中添加以下Secrets：

### 获取Cloudflare API令牌
1. 登录Cloudflare账户 https://dash.cloudflare.com/
2. 点击右上角个人图标，选择"我的个人资料"
3. 在左侧菜单选择"API令牌"
4. 点击"创建令牌"
5. 选择"编辑Cloudflare Workers"模板或创建自定义令牌
6. 确保令牌有权限管理Pages和Workers
7. 创建令牌并复制生成的值

### 获取Cloudflare账户ID
1. 登录Cloudflare账户
2. 账户ID显示在右侧栏或仪表板URL中
3. 它是一串字母数字字符，形如：a1b2c3d4e5f6g7h8i9j0

### 在GitHub添加Secrets
1. 进入GitHub仓库
2. 点击"Settings" > "Secrets and variables" > "Actions"
3. 点击"New repository secret"
4. 添加以下两个Secrets：
   - 名称：`CLOUDFLARE_API_TOKEN`，值：您的API令牌
   - 名称：`CLOUDFLARE_ACCOUNT_ID`，值：您的账户ID

添加这些Secrets后，GitHub Actions将能够自动部署到Cloudflare Pages。