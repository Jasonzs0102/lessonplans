/**
 * 文件: server/routes/generate.js
 * 
 * 教案生成路由 - 定义教案生成相关的API路由
 * 
 * 接口:
 * - POST /generate: 生成体育教案
 * 
 * 功能:
 * - 集成生成控制器的教案生成功能
 * - 处理教案生成请求并返回结果
 */
const express = require('express');
const router = express.Router();
const { generateLessonPlan } = require('../controllers/generateController');

// 教案生成接口
router.post('/generate', generateLessonPlan);

module.exports = router;
