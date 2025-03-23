/**
 * Cloudflare Worker 入口文件
 * 处理教案生成API请求并转发到AI服务
 */

// CORS 响应头设置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 创建内存请求计数器
// 由于Workers执行期间是无状态的，使用全局变量不会在多个请求间保存
// 但这里结合IP地址作为键记录短期内的请求量，以便于开发者调试和排查问题
const requestCounts = new Map();

// 设置请求限制参数
const REQUEST_WINDOW_MS = 60 * 1000; // 1分钟窗口
const MAX_REQUESTS_PER_WINDOW = 5; // 每个IP每分钟最多5个请求
const ALERT_THRESHOLD = 3; // 达到3个请求时发出警告

// 处理OPTIONS预检请求
function handleOptions(request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// 监控请求频率
function monitorRequestRate(clientIP) {
  const now = Date.now();
  const key = `${clientIP}:${Math.floor(now / REQUEST_WINDOW_MS)}`;
  
  if (!requestCounts.has(key)) {
    requestCounts.set(key, { count: 0, timestamp: now });
  }
  
  const record = requestCounts.get(key);
  record.count++;
  
  // 清理过期记录
  for (const [mapKey, value] of requestCounts.entries()) {
    if (now - value.timestamp > REQUEST_WINDOW_MS) {
      requestCounts.delete(mapKey);
    }
  }
  
  // 检测异常请求频率并记录警告
  if (record.count >= ALERT_THRESHOLD) {
    console.warn(`⚠️ 高频请求警告: IP ${clientIP} 在短时间内发送了 ${record.count} 个请求`);
  }
  
  return record.count;
}

// 生成AI提示词
function generatePrompt(data) {
  const { grade, duration, activity, students, content, requirements } = data;
  
  return `请帮我生成一份详细的体育课教案，遵循以下格式和要求:

## 基本信息
- 年级: ${grade || '未指定'}
- 课时: ${duration || '40'} 分钟
- 运动项目: ${activity || '未指定'}
- 学生人数: ${students || '30'} 人

## 教学内容
${content || '未指定教学内容'}

${requirements ? `## 补充要求\n${requirements}` : ''}

请提供完整的教案，包括教学目标、教学重点难点、教学过程（包括热身活动、基本部分、结束部分）、教学反思等。请确保教案符合体育教学规范，适合指定年龄段的学生。`;
}

// 处理健康检查请求
async function handleHealthCheck(request, env) {
  // 获取客户端IP
  const clientIP = request.headers.get('CF-Connecting-IP') || 
                   request.headers.get('X-Forwarded-For') || 
                   'unknown';
  
  // 监控请求频率
  const requestCount = monitorRequestRate(clientIP);
  
  return new Response(JSON.stringify({ 
    status: 'OK', 
    message: 'Service is running',
    environment: env.NODE_ENV || 'production',
    requestInfo: {
      ip: clientIP,
      requestCount: requestCount,
      timestamp: new Date().toISOString()
    }
  }), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

// 处理教案生成请求
async function handleGenerateLessonPlan(request, env) {
  try {
    // 获取客户端IP
    const clientIP = request.headers.get('CF-Connecting-IP') || 
                     request.headers.get('X-Forwarded-For') || 
                     'unknown';
    
    // 监控请求频率
    const requestCount = monitorRequestRate(clientIP);
    console.log(`📊 请求监控: IP ${clientIP} 在当前窗口发送了 ${requestCount} 个请求`);
    
    // 解析请求体
    const params = await request.json();
    
    // 简单验证
    if (!params || !params.data) {
      return new Response(JSON.stringify({
        success: false,
        message: '参数无效',
        errors: ['缺少必要的data参数']
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
    
    // 生成提示词
    const prompt = generatePrompt(params.data);
    
    // 确定要使用的模型
    const model = env.AI_MODEL_NAME || 'qwq-plus';
    
    // 首先尝试非流式请求，如果失败则回退到流式请求
    try {
      // 调用AI API - 非流式方式
      const response = await fetch(`${env.AI_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: prompt }],
          stream: false,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`AI API响应错误: ${response.status}`);
      }
      
      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // 记录成功请求
      console.log(`✅ 教案生成成功: IP ${clientIP} 使用非流式模式`);
      
      // 返回生成的教案
      return new Response(JSON.stringify({
        success: true,
        lessonPlan: content,
        requestInfo: {
          ip: clientIP,
          requestCount: requestCount,
          timestamp: new Date().toISOString()
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    } catch (nonStreamError) {
      console.error('非流式请求失败，尝试流式请求:', nonStreamError);
      
      // 回退到流式请求
      const streamResponse = await fetch(`${env.AI_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: prompt }],
          stream: true,
        }),
      });
      
      if (!streamResponse.ok) {
        throw new Error(`AI API流式响应错误: ${streamResponse.status}`);
      }
      
      // 记录成功请求
      console.log(`✅ 教案生成成功: IP ${clientIP} 使用流式模式`);
      
      // 构造流式响应
      let fullText = '';
      
      // 创建一个新的TransformStream处理流式数据
      const { readable, writable } = new TransformStream();
      
      // 处理原始响应流
      (async () => {
        const reader = streamResponse.body.getReader();
        const encoder = new TextEncoder();
        const writer = writable.getWriter();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // 解析流数据
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.choices && data.choices.length > 0) {
                    const content = data.choices[0].delta?.content || '';
                    if (content) {
                      fullText += content;
                      // 发送进度更新
                      await writer.write(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                    }
                  }
                } catch (e) {
                  console.error('解析流数据错误:', e);
                }
              } else if (line === 'data: [DONE]') {
                // 流结束，发送完成信号和请求信息
                await writer.write(encoder.encode(`data: ${JSON.stringify({ 
                  done: true,
                  requestInfo: {
                    ip: clientIP,
                    requestCount: requestCount,
                    timestamp: new Date().toISOString()
                  }
                })}\n\n`));
              }
            }
          }
        } catch (error) {
          console.error('处理流数据时出错:', error);
          await writer.write(encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`));
        } finally {
          // 关闭writer
          await writer.close();
        }
      })();
      
      // 返回流式响应
      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          ...corsHeaders,
        },
      });
    }
  } catch (error) {
    console.error('生成教案时出错:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: '生成教案时出错',
      error: error.message || '服务器错误'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

// 主请求处理函数
export default {
  async fetch(request, env, ctx) {
    // 获取请求URL
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 处理CORS预检请求
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }
    
    // 路由处理
    if (path === '/api/health' && request.method === 'GET') {
      return handleHealthCheck(request, env);
    }
    
    if (path === '/api/generate' && request.method === 'POST') {
      return handleGenerateLessonPlan(request, env);
    }
    
    // 默认404响应
    return new Response(JSON.stringify({
      error: 'Not Found',
      message: '请求的资源不存在'
    }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
};
