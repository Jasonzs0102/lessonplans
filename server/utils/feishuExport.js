/**
 * 文件: server/utils/feishuExport.js
 * 
 * 飞书表格集成模块
 * 用于将生成的教案内容发送到飞书多维表格
 * 
 * 接口:
 * - exportLessonToFeishu(lessonContent): 将教案内容发送到飞书表格
 * 
 * 功能:
 * - 获取飞书访问令牌
 * - 将教案内容写入飞书多维表格
 * - 处理错误并返回操作状态
 */

// 修复 node-fetch v2.x 在新版 Node.js 中的兼容性问题
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// 飞书配置参数 - 从环境变量获取
const APP_ID = process.env.FEISHU_APP_ID;
const APP_SECRET = process.env.FEISHU_APP_SECRET;
const BASE_ID = process.env.FEISHU_BASE_ID;
const TABLE_ID = process.env.FEISHU_TABLE_ID;

// 检查必要的配置是否存在
const validateConfig = () => {
  const requiredVars = { APP_ID, APP_SECRET, BASE_ID, TABLE_ID };
  const missing = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);
    
  if (missing.length > 0) {
    throw new Error(`飞书导出缺少必要配置: ${missing.join(', ')}`);
  }
};

/**
 * 获取飞书访问令牌
 * @returns {Promise<string>} 访问令牌
 */
async function getAccessToken() {
  const url = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal";
  const headers = {
    "Content-Type": "application/json; charset=utf-8"
  };
  const body = {
    "app_id": APP_ID,
    "app_secret": APP_SECRET
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body)
    });
    const result = await response.json();
    
    if (result.code === 0) {
      console.log("获取飞书访问令牌成功");
      return result.tenant_access_token;
    } else {
      throw new Error(`获取飞书访问令牌失败: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    console.error("获取飞书访问令牌错误:", error);
    throw error;
  }
}

/**
 * 发送教案内容到飞书表格
 * @param {string} accessToken 访问令牌
 * @param {Object} data 教案数据
 * @returns {Promise<Object>} API响应结果
 */
async function sendLessonToBitable(accessToken, lessonContent) {
  const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${BASE_ID}/tables/${TABLE_ID}/records/batch_create`;
  const headers = {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": "application/json; charset=utf-8"
  };
  
  // 构造飞书表格所需的数据格式
  const data = {
    "records": [
      {
        "fields": {
          "网站生成教案内容": lessonContent
        }
      }
    ]
  };

  try {
    console.log("正在发送教案内容到飞书表格...");
    
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data)
    });
    const result = await response.json();
    
    if (result.code === 0) {
      console.log("教案内容成功发送到飞书表格");
      return result;
    } else {
      throw new Error(`发送到飞书表格失败: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    console.error("发送教案内容到飞书表格出错:", error);
    throw error;
  }
}

/**
 * 将教案内容发送到飞书表格的入口函数
 * @param {string} lessonContent 教案内容
 * @returns {Promise<boolean>} 是否成功
 */
async function exportLessonToFeishu(lessonContent) {
  try {
    // 验证飞书配置
    validateConfig();
    
    // 获取飞书访问令牌
    const accessToken = await getAccessToken();
    
    // 发送教案内容到飞书表格
    const result = await sendLessonToBitable(accessToken, lessonContent);
    
    // 返回成功标志
    return result.code === 0;
  } catch (error) {
    console.error("导出教案到飞书出错:", error);
    return false;
  }
}

// 暴露模块接口
module.exports = {
  exportLessonToFeishu
};
