/**
 * AI体育教案生成系统 - 后端服务入口
 */
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const path = require('path');

// 加载环境变量
dotenv.config();

// 创建Express应用实例
const app = express();

// 创建日志记录器
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// 配置中间件
app.use(cors()); // 启用CORS
app.use(express.json()); // 解析JSON请求体

// 配置API请求速率限制
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 50, // 最多50个请求
  standardHeaders: true,
  legacyHeaders: false,
  message: '请求频率过高，请稍后再试。'
});

// 应用API限流到所有/api路由
app.use('/api', apiLimiter);

// 导入路由
const generateRoutes = require('./routes/generate');
const healthRoutes = require('./routes/health');

// 注册路由
app.use('/api', generateRoutes);
app.use('/api', healthRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 启动服务器
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`服务器已启动，正在监听端口 ${PORT}`);
  logger.info(`服务器已启动，正在监听端口 ${PORT}`);
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常：', error);
  console.error('未捕获的异常：', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝：', reason);
  console.error('未处理的Promise拒绝：', reason);
});

module.exports = app;
