/**
 * API服务 - 处理与后端的通信
 */
import axios from 'axios';
import { GenerateRequestData, LessonPlanParams } from '../types';

// API基础URL，可以通过环境变量配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60秒超时时间
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

/**
 * 健康检查API
 * @returns 健康状态信息
 */
export const checkHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    console.error('健康检查失败:', error);
    throw error;
  }
};

/**
 * 生成教案API - SSE流式响应
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
  
  // 设置请求超时
  const timeoutId = setTimeout(() => {
    if (!isRequestCompleted) {
      onError('请求超时，请稍后再试');
      isRequestCompleted = true;
    }
  }, 60000); // 60秒超时
  
  // 根据浏览器支持选择合适的请求方法
  if (isStreamSupported()) {
    // 使用现代浏览器的流式API
    const fetchStreamData = async () => {
      try {
        console.log('使用流式API请求数据');
        // 使用fetch来实现流式响应
        const controller = new AbortController();
        const signal = controller.signal;
        
        const response = await fetch(`${API_BASE_URL}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
          signal: signal
        }).catch(error => {
          console.error('Fetch error:', error);
          throw new Error('网络请求失败，请检查网络连接');
        });

        // 检查响应状态
        if (!response.ok) {
          let errorMessage = '生成教案请求失败';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // 如果无法解析JSON，则使用默认错误消息
          }
          throw new Error(errorMessage);
        }

        // 处理流式响应
        if (!response.body) {
          throw new Error('浏览器不支持流式响应');
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        // 读取流
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              isRequestCompleted = true;
              clearTimeout(timeoutId);
              onComplete(fullContent);
              break;
            }
            
            // 解码二进制数据
            const chunk = decoder.decode(value, { stream: true });
            
            // 尝试作为JSON解析
            try {
              const jsonResponse = JSON.parse(chunk);
              if (jsonResponse.success && jsonResponse.lessonPlan) {
                fullContent = jsonResponse.lessonPlan;
                onProgress(jsonResponse.lessonPlan);
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
            for (const line of lines) {
              if (line.startsWith('data:')) {
                try {
                  const eventData = JSON.parse(line.substring(5));
                  
                  if (eventData.content) {
                    fullContent += eventData.content;
                    onProgress(eventData.content);
                  }
                  
                  if (eventData.error) {
                    isRequestCompleted = true;
                    clearTimeout(timeoutId);
                    onError(eventData.error);
                    return;
                  }
                  
                  if (eventData.done) {
                    isRequestCompleted = true;
                    clearTimeout(timeoutId);
                    onComplete(fullContent);
                    return;
                  }
                } catch (e) {
                  // 忽略解析错误，继续处理
                  console.log('SSE解析错误，尝试直接处理响应');
                }
              }
            }
            
            // 如果无法解析为JSON或SSE，直接将响应内容作为教案内容
            if (chunk && chunk.trim() && !chunk.startsWith('data:')) {
              fullContent += chunk;
              onProgress(chunk);
            }
          }
        } catch (streamError) {
          console.error('Stream processing error:', streamError);
          if (!isRequestCompleted) {
            isRequestCompleted = true;
            clearTimeout(timeoutId);
            onError(streamError instanceof Error ? streamError.message : '处理响应流时出错');
          }
        }
        
      } catch (error) {
        console.error('Request error:', error);
        if (!isRequestCompleted) {
          isRequestCompleted = true;
          clearTimeout(timeoutId);
          onError(error instanceof Error ? error.message : '请求过程中发生错误');
        }
      }
    };
    
    // 执行流式请求
    fetchStreamData();
  } else {
    // 兼容模式：使用axios进行普通请求
    console.log('使用兼容模式请求数据');
    apiClient.post('/generate', requestData, {
      timeout: 60000 // 确保超时设置一致
    })
    .then(response => {
      isRequestCompleted = true;
      clearTimeout(timeoutId);
      
      // 处理正常响应
      if (response.data && response.data.success && response.data.lessonPlan) {
        fullContent = response.data.lessonPlan;
        onProgress(response.data.lessonPlan);
        onComplete(fullContent);
      } else {
        throw new Error('响应数据格式不正确');
      }
    })
    .catch(error => {
      console.error('Axios error:', error);
      if (!isRequestCompleted) {
        isRequestCompleted = true;
        clearTimeout(timeoutId);
        
        // 详细的错误处理
        if (error.response) {
          // 服务器返回了错误状态码
          const message = error.response.data?.message || `请求失败: ${error.response.status}`;
          onError(message);
        } else if (error.request) {
          // 请求已发送但没有收到响应
          onError('服务器无响应，请检查网络连接');
        } else {
          // 请求设置时发生错误
          onError(error.message || '请求过程中发生错误');
        }
      }
    });
  }
  
  // 返回取消函数
  return () => {
    // 标记请求已完成避免进一步处理
    if (!isRequestCompleted) {
      isRequestCompleted = true;
      clearTimeout(timeoutId);
      console.log('取消生成教案请求');
    }
  };
};
