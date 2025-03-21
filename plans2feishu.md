# 飞书表格集成模块

## 1. 功能概述
本模块用于将体育教案生成后的内容自动插入到飞书表格中，方便用户分享和管理教案。该模块已完成测试，可成功将教案数据发送至飞书多维表格。

## 2. 飞书配置参数

### 2.1 应用配置
```
FEISHU_APP_ID="cli_a7538898085e900b"
FEISHU_APP_SECRET="1lr4GbMlZPrHnZsdJfCidcnWAw4YmUIz"
BASE_ID="URNQb7BnRaVJrxs2WmJcmA6knwc"
TABLE_ID="tblLNN8fzd9n9vkU"
```

### 2.2 表格字段配置
- **字段名称**：网站生成教案内容
- **字段类型**：文本
- **数据格式**：文本格式（支持Markdown）

## 3. 完整实现代码

```javascript
/**
 * 飞书表格集成模块
 * 用于将生成的教案内容发送到飞书多维表格
 * 已测试可用
 */

const fetch = require('node-fetch');

// 飞书配置参数
const APP_ID = "cli_a7538898085e900b";
const APP_SECRET = "1lr4GbMlZPrHnZsdJfCidcnWAw4YmUIz";
const BASE_ID = "URNQb7BnRaVJrxs2WmJcmA6knwc";
const TABLE_ID = "tblLNN8fzd9n9vkU";

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

// 测试使用示例
// 如果直接运行该文件，则执行测试
if (require.main === module) {
  // 测试教案内容
  const testLessonContent = `# 小学二年级体育教案 - 基础篮球技能

## 基本信息
- 年级：二年级
- 课程时长：40分钟
- 运动项目：篮球
- 学生人数：30人
- 教学内容：基础篮球技能

## 学习目标
1. 掌握基本的篮球运球技术
2. 培养团队协作意识
3. 发展灵活性和协调性

测试时间: ${new Date().toLocaleString()}`;
  
  // 执行测试
  exportLessonToFeishu(testLessonContent)
    .then(success => {
      if (success) {
        console.log("测试成功！教案内容已发送到飞书表格。");
      } else {
        console.error("测试失败！无法将教案内容发送到飞书表格。");
      }
    });
}
```

## 4. 使用说明

### 4.1 集成到教案生成系统

将此模块集成到教案生成系统的后端服务中：

1. 将代码保存为 `feishuExport.js` 文件在后端项目的适当目录中
2. 安装所需依赖：`npm install node-fetch@2`
3. 在教案生成成功后的处理函数中引入并调用：

```javascript
const { exportLessonToFeishu } = require('./path/to/feishuExport');

// 在教案生成成功后调用
 app.post('/api/generate-lesson', async (req, res) => {
  try {
    // 生成教案的代码...
    const lessonContent = /* 生成的教案内容 */;
    
    // 将教案内容发送到飞书表格
    const exportSuccess = await exportLessonToFeishu(lessonContent);
    
    // 返回结果
    res.json({
      success: true,
      lessonContent,
      exportedToFeishu: exportSuccess
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 4.2 环境变量配置

在生产环境中，应将飞书配置参数移至环境变量：

```
FEISHU_APP_ID=cli_a7538898085e900b
FEISHU_APP_SECRET=1lr4GbMlZPrHnZsdJfCidcnWAw4YmUIz
FEISHU_BASE_ID=URNQb7BnRaVJrxs2WmJcmA6knwc
FEISHU_TABLE_ID=tblLNN8fzd9n9vkU
```

然后在代码中使用环境变量：

```javascript
const APP_ID = process.env.FEISHU_APP_ID;
const APP_SECRET = process.env.FEISHU_APP_SECRET;
const BASE_ID = process.env.FEISHU_BASE_ID;
const TABLE_ID = process.env.FEISHU_TABLE_ID;
```