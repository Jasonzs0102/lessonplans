/**
 * API服务 - 处理与后端的通信
 */
import axios from 'axios';
import { GenerateRequestData, LessonPlanParams } from '../types/index';

// API基础URL，可以通过环境变量配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

// 是否已经包含/api前缀
const hasApiPrefix = API_BASE_URL.endsWith('/api') || API_BASE_URL.includes('/api/');

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 增加到120秒超时时间
});

// 检查浏览器是否支持流式API
const isStreamSupported = () => {
  return (
    typeof Response !== 'undefined' &&
    'body' in Response.prototype &&
    typeof ReadableStream !== 'undefined' &&
    typeof TextDecoder !== 'undefined'
  );
};

// 构建正确的API路径
const getEndpoint = (path: string) => {
  // 如果基础URL已经包含/api前缀，则不再添加
  return hasApiPrefix ? path.replace(/^\/api/, '') : path;
};

/**
 * 健康检查API
 * @returns 健康状态信息
 */
export const checkHealth = async () => {
  try {
    const response = await apiClient.get(getEndpoint('/health'));
    return response.data;
  } catch (error) {
    console.error('健康检查失败:', error);
    throw error;
  }
};

/**
 * 生成教案API - 统一处理响应方式
 * @param params 教案参数
 * @param onProgress 进度回调
 * @param onComplete 完成回调
 * @param onError 错误回调
 */
export const generateLessonPlanStream = (
  params: LessonPlanParams,
  onProgress: (content: string) => void,
  onComplete: (fullContent: string) => void,
  onError: (error: string) => void
) => {
  // 创建完整请求数据
  const requestData: GenerateRequestData = {
    data: params
  };

  // 完整内容
  let fullContent = '';
  
  // 创建请求完成标志
  let isRequestCompleted = false;
  
  // 设置请求超时 - 增加超时时间
  const timeoutId = setTimeout(() => {
    if (!isRequestCompleted) {
      onError('请求超时，请稍后再试');
      isRequestCompleted = true;
    }
  }, 120000); // 120秒超时
  
  // 创建重试机制
  let retryCount = 0;
  const maxRetries = 2;
  
  // 获取正确的API端点
  const generateEndpoint = getEndpoint('/api/generate');
  console.log(`请求API端点: ${API_BASE_URL}${generateEndpoint}`);
  
  const executeRequest = async (useStream = true) => {
    try {
      if (useStream && isStreamSupported()) {
        // 使用现代浏览器的流式API
        console.log('使用流式API请求数据');
        // 使用fetch来实现流式响应
        const controller = new AbortController();
        const signal = controller.signal;
        
        const response = await fetch(`${API_BASE_URL}${generateEndpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream, application/json',
          },
          body: JSON.stringify(requestData),
          signal: signal
        }).catch(error => {
          console.error('Fetch error:', error);
          throw new Error('网络请求失败，请检查网络连接');
        });

        // 检查响应类型
        const contentType = response.headers.get('Content-Type') || '';
        
        // 如果是JSON响应，则直接处理
        if (contentType.includes('application/json')) {
          const data = await response.json();
          if (data.success && data.lessonPlan) {
            fullContent = data.lessonPlan;
            onProgress(data.lessonPlan);
            isRequestCompleted = true;
            clearTimeout(timeoutId);
            onComplete(fullContent);
            return;
          } else if (data.error || !data.success) {
            throw new Error(data.message || data.error || '请求失败');
          }
        }
        
        // 处理流式响应
        if (!response.body) {
          throw new Error('浏览器不支持流式响应');
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        // 设置心跳检测超时
        let lastDataTime = Date.now();
        let contentReceived = false; // 标记是否接收到有效内容
        const heartbeatCheckInterval = setInterval(() => {
          // 只有在没有收到任何内容的情况下才考虑超时重试
          if (!contentReceived && Date.now() - lastDataTime > 20000) { // 增加到20秒
            clearInterval(heartbeatCheckInterval);
            reader.cancel(); // 取消当前读取

            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`数据流中断，第${retryCount}次重试`);
              executeRequest(false); // 重试时使用非流式请求
            } else {
              // 接收的内容不为空时，直接返回已有内容
              if (fullContent.trim()) {
                isRequestCompleted = true;
                clearTimeout(timeoutId);
                onComplete(fullContent);
              } else {
                onError('请求超时，请稍后再试');
              }
            }
          }
        }, 5000);
        
        // 读取流
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              clearInterval(heartbeatCheckInterval);
              isRequestCompleted = true;
              clearTimeout(timeoutId);
              
              // 如果收到完整内容，则完成请求
              if (fullContent.trim()) {
                onComplete(fullContent);
              } else {
                // 使用普通请求作为备选方案
                if (retryCount < maxRetries && !contentReceived) {
                  retryCount++;
                  console.log(`流式请求完成但没有内容，第${retryCount}次重试`);
                  executeRequest(false);
                } else {
                  onError('未收到有效响应');
                }
              }
              break;
            }
            
            // 更新最后数据时间
            lastDataTime = Date.now();
            
            // 解码二进制数据
            const chunk = decoder.decode(value, { stream: true });
            
            // 尝试作为JSON解析
            try {
              const jsonResponse = JSON.parse(chunk);
              if (jsonResponse.success && jsonResponse.lessonPlan) {
                fullContent = jsonResponse.lessonPlan;
                onProgress(jsonResponse.lessonPlan);
                contentReceived = true; // 标记已接收内容
                clearInterval(heartbeatCheckInterval);
                isRequestCompleted = true;
                clearTimeout(timeoutId);
                onComplete(fullContent);
                break;
              }
            } catch (e) {
              // 不是JSON格式，继续尝试作为SSE处理
            }
            
            // 处理SSE格式数据
            const lines = chunk.split('\n\n');
            let hasValidData = false;
            
            for (const line of lines) {
              if (line.startsWith('data:')) {
                try {
                  const eventData = JSON.parse(line.substring(5).trim());
                  hasValidData = true;
                  
                  if (eventData.content) {
                    fullContent += eventData.content;
                    onProgress(fullContent);
                    contentReceived = true; // 标记已接收内容
                  }
                  
                  if (eventData.error) {
                    clearInterval(heartbeatCheckInterval);
                    isRequestCompleted = true;
                    clearTimeout(timeoutId);
                    onError(eventData.error);
                    return;
                  }
                  
                  if (eventData.done) {
                    clearInterval(heartbeatCheckInterval);
                    isRequestCompleted = true;
                    clearTimeout(timeoutId);
                    onComplete(fullContent);
                    return;
                  }
                } catch (e) {
                  console.log('SSE解析错误，尝试直接处理响应', e);
                }
              }
            }
            
            // 如果无法解析为JSON或SSE，直接将响应内容作为教案内容
            if (!hasValidData && chunk && chunk.trim() && !chunk.startsWith('data:')) {
              fullContent += chunk;
              onProgress(fullContent);
              contentReceived = true; // 标记已接收内容
            }
          }
        } catch (streamError) {
          clearInterval(heartbeatCheckInterval);
          console.error('Stream processing error:', streamError);
          
          // 如果接收了一些内容但出错，仍返回已接收内容
          if (fullContent.trim()) {
            isRequestCompleted = true;
            clearTimeout(timeoutId);
            onComplete(fullContent);
          } else if (retryCount < maxRetries && !contentReceived) {
            retryCount++;
            console.log(`流处理错误，第${retryCount}次重试`);
            executeRequest(false); // 回退到非流式请求
          } else if (!isRequestCompleted) {
            isRequestCompleted = true;
            clearTimeout(timeoutId);
            onError(streamError instanceof Error ? streamError.message : '处理响应流时出错');
          }
        }
      } else {
        // 兼容模式：使用axios进行普通请求
        console.log('使用兼容模式请求数据');
        const response = await apiClient.post(generateEndpoint, requestData, {
          timeout: 120000 // 确保超时设置一致
        });
        
        // 处理正常响应
        if (response.data && response.data.success && response.data.lessonPlan) {
          fullContent = response.data.lessonPlan;
          onProgress(response.data.lessonPlan);
          isRequestCompleted = true;
          clearTimeout(timeoutId);
          onComplete(fullContent);
        } else {
          throw new Error('响应数据格式不正确');
        }
      }
    } catch (error) {
      console.error('Request error:', error);
      
      // 重试逻辑
      if (retryCount < maxRetries && !isRequestCompleted) {
        retryCount++;
        console.log(`请求失败，第${retryCount}次重试`);
        // 第一次尝试切换请求模式，之后再尝试一次
        executeRequest(retryCount === 1 ? !useStream : false);
      } else if (!isRequestCompleted) {
        isRequestCompleted = true;
        clearTimeout(timeoutId);
        
        // 详细的错误处理
        if (axios.isAxiosError(error) && error.response) {
          // 服务器返回了错误状态码
          const message = error.response.data?.message || `请求失败: ${error.response.status}`;
          onError(message);
        } else if (axios.isAxiosError(error) && error.request) {
          // 请求已发送但没有收到响应
          onError('服务器无响应，请检查网络连接');
        } else {
          // 请求设置时发生错误
          onError(error instanceof Error ? error.message : '请求过程中发生错误');
        }
      }
    }
  };
  
  // 执行请求
  executeRequest();
  
  // 返回取消函数
  return () => {
    // 标记请求已完成避免进一步处理
    if (!isRequestCompleted) {
      isRequestCompleted = true;
      clearTimeout(timeoutId);
    }
  };
};
