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
  return new Response(JSON.stringify({ status: 'OK', message: 'Service is running' }), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

// 处理教案生成请求
async function handleGenerateLessonPlan(request, env) {
  try {
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
    
    // 返回生成的教案
    return new Response(JSON.stringify({
      success: true,
      lessonPlan: content,
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
    
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
      return handleHealthCheck(request);
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
