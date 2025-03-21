/**
 * 文件: server/controllers/generateController.js
 * 
 * 教案生成控制器 - 处理教案生成请求并管理AI响应
 * 
 * 接口:
 * - generateLessonPlan(req, res): 处理教案生成请求
 * 
 * 功能:
 * - 参数验证与错误处理
 * - 响应缓存管理
 * - 流式AI响应处理
 * - 集成飞书导出功能
 */
const { OpenAI } = require('openai');
const { generatePrompt } = require('../utils/promptTemplate');
const { formatResponse } = require('../utils/formatResponse');
const { exportLessonToFeishu } = require('../utils/feishuExport');
const { validateParams } = require('../middlewares/validator');
const NodeCache = require('node-cache');

// 创建内存缓存实例
const responseCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// 配置OpenAI客户端
const openai = new OpenAI({
  apiKey: process.env.AI_API_KEY,
  baseURL: process.env.AI_API_URL,
  // 为阿里云 DashScope 兼容模式添加额外配置
  defaultHeaders: {
    "Content-Type": "application/json"
  },
  defaultQuery: {
    // 可能需要额外的查询参数
  }
});

/**
 * 生成体育教案
 * @param {Object} req - 请求对象，包含生成教案所需参数
 * @param {Object} res - 响应对象，用于返回生成的教案内容或错误信息
 * @returns {void} - 返回SSE流或JSON响应
 */
const generateLessonPlan = async (req, res) => {
  try {
    // 验证输入参数
    const params = req.body;
    const validatedParams = validateParams(params);
    
    if (!validatedParams.success) {
      return res.status(400).json({
        success: false,
        message: '参数无效',
        errors: validatedParams.errors
      });
    }
    
    // 检查缓存中是否已有相同参数的响应
    const cacheKey = JSON.stringify(params);
    const cachedResponse = responseCache.get(cacheKey);
    
    if (cachedResponse) {
      console.log('使用缓存的响应');
      return res.json({
        success: true,
        lessonPlan: cachedResponse,
        fromCache: true
      });
    }
    
    // 生成提示词
    const prompt = generatePrompt(params.data);
    
    // 确定要使用的模型
    const model = process.env.AI_MODEL_NAME || 'qwq-plus';
    
    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // 创建带超时的请求（QWQ模型仅支持流式输出）
    const stream = await openai.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      stream: true
    });
    
    // 存储完整响应以便缓存
    let fullResponse = '';
    
    // 处理流式响应
    for await (const chunk of stream) {
      if (!chunk.choices?.length) {
        continue;
      }
      
      const delta = chunk.choices[0].delta;
      
      // 处理正式回复内容
      if (delta.content) {
        // 向客户端发送数据
        res.write(`data: ${JSON.stringify({ content: delta.content })}\n\n`);
        
        // 累积完整响应
        fullResponse += delta.content;
      }
    }
    
    // 格式化完整响应
    const formattedResponse = formatResponse(fullResponse);
    
    // 缓存格式化后的响应
    responseCache.set(cacheKey, formattedResponse);
    
    // 尝试发送到飞书（如果配置了）
    try {
      if (process.env.ENABLE_FEISHU_EXPORT === 'true') {
        await exportLessonToFeishu(formattedResponse);
      }
    } catch (feishuError) {
      console.error('发送到飞书失败:', feishuError);
      // 继续处理，不影响主流程
    }
    
    // 结束响应
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
    
  } catch (error) {
    console.error('生成教案时出错:', error);
    
    // 检查响应是否已经开始发送
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: error.message || '服务器错误' })}\n\n`);
      res.end();
    } else {
      res.status(500).json({
        success: false,
        message: '生成教案时出错',
        error: error.message || '服务器错误'
      });
    }
  }
};

module.exports = {
  generateLessonPlan
};
