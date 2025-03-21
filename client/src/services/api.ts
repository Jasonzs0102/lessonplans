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
  
  // 创建EventSource
  const fetchData = async () => {
    try {
      // 使用fetch来实现SSE
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      // 检查响应状态
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '生成教案请求失败');
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      // 创建文本解码器
      const decoder = new TextDecoder();
      
      // 读取流
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              onComplete(fullContent);
              break;
            }
            
            // 解码二进制数据
            const chunk = decoder.decode(value, { stream: true });
            
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
                    onError(eventData.error);
                    return;
                  }
                  
                  if (eventData.done) {
                    onComplete(fullContent);
                    return;
                  }
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          }
        } catch (error) {
          if (error instanceof Error) {
            onError(error.message);
          } else {
            onError('处理响应流时出错');
          }
        }
      };
      
      // 开始处理流
      processStream();
      
    } catch (error) {
      if (error instanceof Error) {
        onError(error.message);
      } else {
        onError('请求过程中发生错误');
      }
    }
  };
  
  // 执行请求
  fetchData();
  
  // 返回取消函数
  return () => {
    // 目前没有取消流的API，但可以在此处理资源清理
    console.log('取消生成教案流');
  };
};
