/**
 * Cloudflare Worker 入口文件
 * 处理教案生成API请求并转发到AI服务
 * 包含缓存优化以提升性能
 */

// 创建缓存实例
const CACHE_TTL = 60 * 60 * 24; // 24小时缓存时间
const CACHE_NAME = 'lessonplan-cache';

// CORS 响应头设置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 处理OPTIONS预检请求
function handleOptions(request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
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
async function handleHealthCheck(request) {
  return new Response(JSON.stringify({ status: 'OK', message: 'Service is running', timestamp: new Date().toISOString() }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60', // 缓存60秒
      ...corsHeaders,
    },
  });
}

// 处理教案生成请求
async function handleGenerateLessonPlan(request, env, ctx) {
  try {
    // 解析请求体
    const params = await request.json();
    
    // 生成缓存键
    const cacheKey = JSON.stringify(params);
    
    // 尝试从缓存中获取
    const cache = caches.default;
    const cacheUrl = new URL(request.url);
    const cacheKey2 = new Request(`${cacheUrl.origin}${cacheUrl.pathname}/cache/${btoa(cacheKey)}`, {
      method: 'GET',
      headers: request.headers
    });
    
    // 检查缓存
    const cachedResponse = await cache.match(cacheKey2);
    if (cachedResponse) {
      console.log('使用缓存的响应');
      // 添加表明来自缓存的头
      const headers = new Headers(cachedResponse.headers);
      headers.append('X-Cache', 'HIT');
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });
    }
    
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
    
    // 调用AI API
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
      const errorData = await response.text();
      throw new Error(`AI API响应错误: ${response.status} ${errorData}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // 格式化响应
    const responseData = {
      success: true,
      lessonPlan: content,
      timestamp: new Date().toISOString()
    };
    
    // 创建响应对象
    const responseBody = JSON.stringify(responseData);
    const responseHeaders = {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400', // 缓存24小时
      'X-Cache': 'MISS',
      ...corsHeaders,
    };
    
    const aiResponse = new Response(responseBody, {
      headers: responseHeaders,
    });
    
    // 将响应存入缓存
    ctx.waitUntil(cache.put(cacheKey2, aiResponse.clone()));
    
    return aiResponse;
    
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
    
    // 检查是否可缓存的请求方法
    const isCacheable = request.method === 'GET';
    
    // 如果是GET请求，尝试从缓存中获取
    if (isCacheable) {
      const cache = caches.default;
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        const headers = new Headers(cachedResponse.headers);
        headers.append('X-Cache', 'HIT');
        return new Response(cachedResponse.body, {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers: headers
        });
      }
    }
    
    // 路由处理
    let finalResponse;
    
    if (path === '/api/health' && request.method === 'GET') {
      finalResponse = await handleHealthCheck(request);
    } else if (path === '/api/generate' && request.method === 'POST') {
      finalResponse = await handleGenerateLessonPlan(request, env, ctx);
    } else {
    
      // 默认404响应
      finalResponse = new Response(JSON.stringify({
        error: 'Not Found',
        message: '请求的资源不存在'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          ...corsHeaders,
        },
      });
    }
    
    // 如果是可缓存的请求，将响应存入缓存
    if (isCacheable && finalResponse.status === 200) {
      const cache = caches.default;
      const responseToCacheHeaders = new Headers(finalResponse.headers);
      
      if (!responseToCacheHeaders.has('Cache-Control')) {
        responseToCacheHeaders.set('Cache-Control', 'public, max-age=3600');
      }
      
      const responseToCache = new Response(finalResponse.body, {
        status: finalResponse.status,
        statusText: finalResponse.statusText,
        headers: responseToCacheHeaders
      });
      
      ctx.waitUntil(cache.put(request, responseToCache.clone()));
    }
    
    return finalResponse;
  }
};
