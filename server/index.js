/**
 * AI体育教案生成系统 - 后端服务入口
 */
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const path = require('path');

// 加载环境变量
dotenv.config();

// 创建Express应用实例
const app = express();

// 获取当前环境
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

// 简化日志系统
const simpleLogger = (message, isError = false) => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}`;
  if (isError) {
    console.error(logMessage);
  } else {
    console.log(logMessage);
  }
};

// 配置中间件
app.use(cors()); // 启用CORS
app.use(express.json()); // 解析JSON请求体

// 配置API请求速率限制 - 仅在生产环境启用
if (isProduction) {
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 50, // 最多50个请求
    message: '请求频率过高，请稍后再试。'
  });

  // 应用API限流到所有/api路由
  app.use('/api', apiLimiter);
  simpleLogger('已启用API请求限制 (生产环境)');
} else {
  simpleLogger('已禁用API请求限制 (开发环境)');
}

// 导入路由
const generateRoutes = require('./routes/generate');
const healthRoutes = require('./routes/health');

// 注册路由
app.use('/api', generateRoutes);
app.use('/api', healthRoutes);

// 简化错误处理中间件
app.use((err, req, res, next) => {
  simpleLogger(`${err.status || 500} - ${err.message} - ${req.originalUrl}`, true);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误'
  });
});

// 启动服务器
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  simpleLogger(`服务器已启动，正在监听端口 ${PORT}，运行模式: ${isProduction ? '生产环境' : '开发环境'}`);
});

// 简化异常处理
process.on('uncaughtException', (error) => {
  simpleLogger(`未捕获的异常：${error.message}`, true);
});

process.on('unhandledRejection', (reason) => {
  simpleLogger(`未处理的Promise拒绝：${reason}`, true);
});

module.exports = app;
