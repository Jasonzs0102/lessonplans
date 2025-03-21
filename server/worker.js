/**
 * Cloudflare Worker 入口文件 - 将Express应用适配到Workers环境
 */
import app from './index.js';

// 适配器函数：将Express应用转换为Cloudflare Worker处理程序
async function handleRequest(request) {
  // 创建一个模拟的Express环境
  return new Promise((resolve) => {
    const expressRequest = {
      method: request.method,
      url: new URL(request.url).pathname,
      headers: Object.fromEntries(request.headers),
      body: request.body,
      ip: request.headers.get('CF-Connecting-IP'),
    };

    const expressResponse = {
      statusCode: 200,
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = JSON.stringify(data);
        this.headers.set('Content-Type', 'application/json');
        resolve(new Response(this.body, {
          status: this.statusCode,
          headers: this.headers,
        }));
        return this;
      },
      send(data) {
        this.body = typeof data === 'string' ? data : JSON.stringify(data);
        resolve(new Response(this.body, {
          status: this.statusCode,
          headers: this.headers,
        }));
        return this;
      },
      setHeader(name, value) {
        this.headers.set(name, value);
        return this;
      },
      end() {
        resolve(new Response(this.body, {
          status: this.statusCode,
          headers: this.headers,
        }));
        return this;
      }
    };

    // 调用Express应用处理请求
    app(expressRequest, expressResponse);
  });
}

// 导出Cloudflare Worker处理函数
export default {
  async fetch(request, env, ctx) {
    try {
      return await handleRequest(request);
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Worker内部错误',
        error: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  }
};
