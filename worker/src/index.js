import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import { Router } from 'itty-router';
import axios from 'axios';
import fetch from 'node-fetch';
import cors from 'cors';

// 创建路由器
const router = Router();

// CORS处理
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// 健康检查接口
router.get('/api/health', async (request, env) => {
  return new Response(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: '服务正常运行中',
      environment: env.NODE_ENV
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
});

// 教案生成API
router.post('/api/generate', async (request, env) => {
  try {
    const requestData = await request.json();
    
    // 生成提示词 (简化示例，实际应从server的promptTemplate导入)
    const prompt = `
    请为一个${requestData.grade}的体育课编写一个完整的教案。
    运动项目: ${requestData.sportType}
    课程时长: ${requestData.duration}分钟
    学生人数: ${requestData.studentCount}人
    主要教学内容: ${requestData.teachingContent}
    补充要求: ${requestData.requirements}

    请提供包含以下部分的完整教案:
    1. 基本信息（年级、课时、人数等）
    2. 学习目标（认知目标、技能目标、情感目标）
    3. 主要教学内容
    4. 教学重难点
    5. 安全保障措施
    6. 场地器材准备
    7. 课的结构（包括各个部分的时间安排、内容、组织形式和注意事项）
    8. 预计学生负荷情况
    9. 教学反思要点

    格式要求:
    - 使用Markdown格式
    - 结构清晰，层次分明
    - 专业、规范、实用
    `;
    
    // 调用阿里云QWQ API
    const response = await axios({
      method: 'post',
      url: env.AI_API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.AI_API_KEY}`
      },
      data: {
        model: env.AI_MODEL_NAME,
        messages: [
          { role: 'user', content: prompt }
        ],
        stream: false  // Worker中不使用流式输出
      },
      responseType: 'json'
    });
    
    const result = response.data.choices[0].message.content;
    
    // 飞书导出功能（如果启用）
    if (env.ENABLE_FEISHU_EXPORT === 'true') {
      try {
        await exportToFeishu(result, requestData, env);
      } catch (feishuError) {
        console.error('飞书导出失败:', feishuError);
        // 继续处理，不影响主流程
      }
    }
    
    return new Response(
      JSON.stringify({ success: true, result }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error('生成教案错误:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || '服务器内部错误' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});

// 处理OPTIONS请求（CORS预检）
router.options('*', () => {
  return new Response(null, {
    headers: corsHeaders
  });
});

// 飞书导出功能
async function exportToFeishu(content, params, env) {
  // 获取飞书访问令牌
  const tokenResponse = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      app_id: env.FEISHU_APP_ID,
      app_secret: env.FEISHU_APP_SECRET
    })
  });
  
  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.tenant_access_token;
  
  if (!accessToken) {
    throw new Error('获取飞书访问令牌失败');
  }
  
  // 当前日期时间
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0];
  
  // 创建记录
  const createResponse = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${env.FEISHU_BASE_ID}/tables/${env.FEISHU_TABLE_ID}/records`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      fields: {
        '生成日期': dateStr,
        '生成时间': timeStr,
        '年级': params.grade,
        '时长': params.duration,
        '项目': params.sportType,
        '学生人数': params.studentCount,
        '教学内容': params.teachingContent,
        '补充要求': params.requirements,
        '教案内容': content
      }
    })
  });
  
  const createResult = await createResponse.json();
  if (!createResult.data) {
    throw new Error('发送教案到飞书失败');
  }
  
  return createResult;
}

// 主处理函数
async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);
  
  // 处理API请求
  if (url.pathname.startsWith('/api/')) {
    const response = await router.handle(request, env);
    return response;
  }
  
  // 处理静态资源
  try {
    // 设置自定义缓存控制
    const cacheControl = {
      browserTTL: 60 * 60 * 24, // 1天
      edgeTTL: 60 * 60 * 24 * 2, // 2天
      bypassCache: false,
    };
    
    // 获取静态资源
    return await getAssetFromKV(
      {
        request,
        waitUntil: ctx.waitUntil.bind(ctx),
      },
      {
        ASSET_NAMESPACE: env.__STATIC_CONTENT,
        ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
        cacheControl,
      }
    );
  } catch (error) {
    // 如果找不到资源，返回index.html（SPA路由支持）
    if (error.status === 404) {
      try {
        const notFoundResponse = await getAssetFromKV(
          {
            request: new Request(url.origin),
            waitUntil: ctx.waitUntil.bind(ctx),
          },
          {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
          }
        );
        
        return new Response(notFoundResponse.body, {
          ...notFoundResponse,
          status: 200,
        });
      } catch (indexError) {
        return new Response('未找到页面', { status: 404 });
      }
    }
    
    return new Response('服务器错误', { status: 500 });
  }
}

// Worker导出
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  },
}; 