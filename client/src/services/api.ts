/**
 * API服务 - 处理与后端的通信
 */
import axios from 'axios';
import { GenerateRequestData, LessonPlanParams } from '../types/index';

// API基础URL，可以通过环境变量配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

// 检查URL是否已包含/api前缀
const hasApiPrefix = API_BASE_URL.endsWith('/api') || API_BASE_URL.includes('/api/');

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 增加到120秒超时时间
});

// 检查浏览器是否支持流式API - 增强兼容性检测
const isStreamSupported = () => {
  try {
    return (
      typeof Response !== 'undefined' &&
      'body' in Response.prototype &&
      typeof ReadableStream !== 'undefined' &&
      typeof TextDecoder !== 'undefined' &&
      'getReader' in ReadableStream.prototype
    );
  } catch (e) {
    console.warn('流式API检测失败:', e);
    return false;
  }
};

// 检测是否为移动设备 - 针对移动设备采用更保守的策略
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// 构建正确的API路径
const getEndpoint = (path: string) => {
  // 如果基础URL已经包含/api前缀，则不再添加
  if (hasApiPrefix) {
    // 去掉path开头的/api，避免重复
    return path.replace(/^\/api/, '');
  }
  return path;
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
  
  // 根据设备调整超时时间 - 移动设备给更长的超时
  const timeoutDuration = isMobileDevice() ? 180000 : 120000; // 移动设备3分钟，桌面设备2分钟
  
  // 设置请求超时
  const timeoutId = setTimeout(() => {
    if (!isRequestCompleted) {
      console.error(`请求超时 (${timeoutDuration/1000}秒)`);
      onError('请求超时，请稍后再试');
      isRequestCompleted = true;
    }
  }, timeoutDuration);
  
  // 创建重试机制
  let retryCount = 0;
  const maxRetries = isMobileDevice() ? 3 : 2; // 移动设备增加一次重试次数
  
  // 重试延迟 - 指数退避策略
  const getRetryDelay = (attempt: number): number => {
    const baseDelay = isMobileDevice() ? 2000 : 1000; // 移动设备基础延迟更长
    return Math.min(baseDelay * Math.pow(2, attempt), 10000); // 最大10秒
  };
  
  // 获取正确的API端点
  const generateEndpoint = getEndpoint('/api/generate');
  const fullApiUrl = API_BASE_URL + generateEndpoint;
  console.log(`请求API端点: ${fullApiUrl}`);
  
  // 设备和环境信息，用于调试
  const deviceInfo = {
    isMobile: isMobileDevice(),
    supportsStream: isStreamSupported(),
    userAgent: navigator.userAgent
  };
  console.log('设备信息:', deviceInfo);
  
  // 移动设备默认使用兼容模式
  const shouldUseStream = isStreamSupported() && !isMobileDevice();
  
  const executeRequest = async (useStream = shouldUseStream) => {
    try {
      if (useStream && isStreamSupported()) {
        // 使用现代浏览器的流式API
        console.log('使用流式API请求数据');
        // 使用fetch来实现流式响应
        const controller = new AbortController();
        const signal = controller.signal;
        
        // 添加更多的调试信息
        console.log('发送请求到:', fullApiUrl);
        console.log('请求数据:', JSON.stringify(requestData));
        
        const response = await fetch(fullApiUrl, {
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

        // 记录响应状态和头信息
        console.log('响应状态:', response.status, response.statusText);
        console.log('响应头:', [...response.headers.entries()].reduce((obj: Record<string, string>, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {}));
        
        // 检查响应状态
        if (!response.ok) {
          const errorText = await response.text().catch(() => '无法获取错误详情');
          console.error(`响应错误 (${response.status}): ${errorText}`);
          throw new Error(`API错误: ${response.status} ${response.statusText}${errorText ? ' - ' + errorText : ''}`);
        }
        
        // 检查响应类型
        const contentType = response.headers.get('Content-Type') || '';
        console.log('响应内容类型:', contentType);
        
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
        
        // 设置心跳检测超时 - 根据设备调整检测间隔
        let lastDataTime = Date.now();
        let contentReceived = false; // 标记是否接收到有效内容
        const heartbeatInterval = isMobileDevice() ? 10000 : 5000; // 移动设备10秒检测一次
        const heartbeatTimeout = isMobileDevice() ? 30000 : 20000; // 移动设备30秒超时
        
        const heartbeatCheckInterval = setInterval(() => {
          // 只有在没有收到任何内容的情况下才考虑超时重试
          const timeSinceLastData = Date.now() - lastDataTime;
          console.log(`心跳检测: 上次数据接收 ${timeSinceLastData}ms 前, 内容接收状态: ${contentReceived}`);
          
          if (!contentReceived && timeSinceLastData > heartbeatTimeout) {
            console.warn(`数据流超时: ${heartbeatTimeout}ms 内未收到数据`);
            clearInterval(heartbeatCheckInterval);
            reader.cancel(); // 取消当前读取

            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`数据流中断，第${retryCount}次重试，切换到兼容模式`);
              executeRequest(false); // 重试时使用非流式请求
            } else {
              // 接收的内容不为空时，直接返回已有内容
              if (fullContent.trim()) {
                console.log(`最大重试次数已达，使用已接收内容: ${fullContent.length} 字符`);
                isRequestCompleted = true;
                clearTimeout(timeoutId);
                onComplete(fullContent);
              } else {
                console.error('请求失败: 多次重试后未收到有效内容');
                onError('请求超时，请稍后再试');
              }
            }
          }
        }, heartbeatInterval);
        
        // 读取流
        try {
          console.log('开始读取响应流...');
          let chunkCount = 0;
          
          while (true) {
            const { done, value } = await reader.read();
            chunkCount++;
            
            if (done) {
              console.log(`流读取完成，共接收 ${chunkCount} 个数据块`);
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
            console.log(`收到数据块: ${chunk.length} 字节`);
            
            // 尝试不同的数据格式解析
            // 1. 先尝试整个响应作为JSON
            try {
              const jsonResponse = JSON.parse(chunk);
              if (jsonResponse.success && jsonResponse.lessonPlan) {
                console.log('整块JSON响应解析成功');
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
              // 不是单个JSON对象，尝试其他格式
              console.log('整块JSON解析失败，尝试SSE格式...');
            }
            
            // 2. 尝试解析为SSE格式
            // 更强健的SSE解析 - 支持不同的分隔符
            const lines = chunk.split(/\n\n|\r\n\r\n|\r\r/).filter(line => line.trim());
            let hasValidData = false;
            
            for (const line of lines) {
              if (line.startsWith('data:')) {
                try {
                  const dataContent = line.substring(5).trim();
                  console.log('解析SSE数据:', dataContent.substring(0, 50) + (dataContent.length > 50 ? '...' : ''));
                  
                  const eventData = JSON.parse(dataContent);
                  hasValidData = true;
                  
                  if (eventData.content) {
                    fullContent += eventData.content;
                    onProgress(fullContent);
                    contentReceived = true; // 标记已接收内容
                    console.log(`已接收内容: ${fullContent.length} 字符`);
                  }
                  
                  if (eventData.error) {
                    console.error('SSE错误事件:', eventData.error);
                    clearInterval(heartbeatCheckInterval);
                    isRequestCompleted = true;
                    clearTimeout(timeoutId);
                    onError(eventData.error);
                    return;
                  }
                  
                  if (eventData.done) {
                    console.log('SSE完成事件');
                    clearInterval(heartbeatCheckInterval);
                    isRequestCompleted = true;
                    clearTimeout(timeoutId);
                    onComplete(fullContent);
                    return;
                  }
                } catch (e) {
                  console.warn('SSE数据解析错误:', e);
                  // 尝试作为文本直接处理
                  const textContent = line.substring(5).trim();
                  if (textContent && !hasValidData) {
                    fullContent += textContent;
                    onProgress(fullContent);
                    contentReceived = true;
                  }
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
        console.log('使用兼容模式请求数据 (axios)');
        
        try {
          console.log('发送兼容模式请求到:', fullApiUrl);
          console.log('请求数据:', JSON.stringify(requestData));
          
          // 增加超时时间，特别是移动设备
          const compatibilityTimeout = isMobileDevice() ? 180000 : 120000;
          
          const response = await apiClient.post(generateEndpoint, requestData, {
            timeout: compatibilityTimeout,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          console.log('兼容模式响应状态:', response.status);
          
          // 处理正常响应
          if (response.data && response.data.success && response.data.lessonPlan) {
            console.log('兼容模式成功接收数据');
            fullContent = response.data.lessonPlan;
            onProgress(response.data.lessonPlan);
            isRequestCompleted = true;
            clearTimeout(timeoutId);
            onComplete(fullContent);
          } else {
            console.error('响应数据格式不正确:', response.data);
            throw new Error('响应数据格式不正确');
          }
        } catch (axiosError) {
          console.error('兼容模式请求错误:', axiosError);
          // 将重试逻辑移到外层处理
          throw axiosError;
        }
      }
    } catch (error) {
      console.error('Request error:', error);
      
      // 重试逻辑
      if (retryCount < maxRetries && !isRequestCompleted) {
        retryCount++;
        const retryDelay = getRetryDelay(retryCount);
        console.log(`请求失败，将在${retryDelay}ms后进行第${retryCount}次重试`);
        
        // 使用延迟重试
        setTimeout(() => {
          // 第一次尝试切换请求模式，之后再尝试一次
          executeRequest(retryCount === 1 ? !useStream : false);
        }, retryDelay);
      } else if (!isRequestCompleted) {
        isRequestCompleted = true;
        clearTimeout(timeoutId);
        
        // 详细的错误处理
        if (axios.isAxiosError(error) && error.response) {
          // 服务器返回了错误状态码
          const message = error.response.data?.message || `请求失败: ${error.response.status}`;
          console.error('服务器错误:', error.response.status, message);
          onError(message);
        } else if (axios.isAxiosError(error) && error.request) {
          // 请求已发送但没有收到响应
          console.error('网络错误: 服务器未响应');
          onError('服务器无响应，请检查网络连接');
        } else {
          // 请求设置时发生错误
          const errorMessage = error instanceof Error ? error.message : '请求过程中发生错误';
          console.error('请求错误:', errorMessage);
          onError(errorMessage);
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
