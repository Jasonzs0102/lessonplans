/**
 * API测试脚本
 * 用于验证前后端通信是否正常
 */
const axios = require('axios');

// 基础URL配置
const API_BASE_URL = 'http://localhost:5001';

/**
 * 测试健康检查API
 */
async function testHealthCheck() {
  console.log('测试健康检查API...');
  try {
    const response = await axios.get(`${API_BASE_URL}/api/health`);
    console.log('✅ 健康检查成功:', response.data);
    return true;
  } catch (error) {
    console.error('❌ 健康检查失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    return false;
  }
}

/**
 * 测试教案生成API
 */
async function testGenerateAPI() {
  console.log('\n测试教案生成API...');
  
  // 构建测试数据
  const testData = {
    data: {
      grade: '水平三（5年级）',
      duration: '40',
      sportType: '篮球',
      studentCount: '30',
      teachingContent: '原地运球基础练习',
      requirements: '注重趣味性，适合初学者'
    }
  };
  
  try {
    // 普通POST请求，不使用SSE
    const response = await axios.post(`${API_BASE_URL}/api/generate`, testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10秒超时
    });
    
    console.log('✅ 教案生成API测试成功');
    console.log('响应状态:', response.status);
    console.log('响应头信息类型:', response.headers['content-type']);
    console.log('响应数据片段:', JSON.stringify(response.data).substring(0, 100) + '...');
    return true;
  } catch (error) {
    console.error('❌ 教案生成API测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    return false;
  }
}

/**
 * 测试SSE流式生成API
 */
async function testSSEGenerateAPI() {
  console.log('\n测试SSE流式生成API...');
  
  // 构建测试数据
  const testData = {
    data: {
      grade: '水平三（5年级）',
      duration: '40',
      sportType: '篮球',
      studentCount: '30',
      teachingContent: '原地运球基础练习',
      requirements: '注重趣味性，适合初学者'
    }
  };
  
  try {
    // 使用fetch API模拟前端的SSE请求
    console.log('模拟SSE请求中...(将在30秒后超时)');
    
    // 如果在Node.js环境下，需要自行安装和导入node-fetch
    // const fetch = require('node-fetch');
    
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let receivedData = false;
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      // 解码二进制数据
      const chunk = decoder.decode(value, { stream: true });
      
      // 处理SSE格式数据
      const lines = chunk.split('\n\n');
      for (const line of lines) {
        if (line.startsWith('data:')) {
          try {
            receivedData = true;
            const eventData = JSON.parse(line.substring(5));
            console.log('收到SSE数据:', eventData.content ? eventData.content.substring(0, 30) + '...' : eventData);
            
            if (eventData.done) {
              console.log('✅ SSE完成信号收到');
              return true;
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
    
    if (receivedData) {
      console.log('✅ SSE流式API测试部分成功（收到了数据但没有完成信号）');
      return true;
    } else {
      console.error('❌ SSE流式API测试失败：未接收到任何数据');
      return false;
    }
    
  } catch (error) {
    console.error('❌ SSE流式API测试失败:', error.message);
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runTests() {
  console.log('=== API测试开始 ===');
  console.log(`时间: ${new Date().toLocaleString()}`);
  console.log(`测试目标: ${API_BASE_URL}\n`);
  
  // 测试健康检查
  const healthCheckSuccess = await testHealthCheck();
  
  // 只有健康检查成功才继续测试其他API
  if (healthCheckSuccess) {
    // 测试普通教案生成API
    await testGenerateAPI();
    
    // 测试SSE流式教案生成API
    // 注意：这个测试在纯Node.js环境可能需要额外的库
    try {
      await testSSEGenerateAPI();
    } catch (error) {
      console.error('SSE测试需要在浏览器环境或安装特定Node.js包（如node-fetch）才能运行');
    }
  }
  
  console.log('\n=== API测试结束 ===');
}

// 执行测试
runTests().catch(error => {
  console.error('测试过程中发生错误:', error);
});
