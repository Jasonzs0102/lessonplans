/**
 * 文件: server/utils/formatResponse.js
 * 
 * 教案响应格式化工具
 * 用于标准化AI生成的教案响应格式
 * 
 * 接口:
 * - formatResponse(response): 格式化AI生成的教案响应内容
 * 
 * 功能:
 * - 统一中英文标点符号
 * - 标准化标题格式(# 标题)
 * - 标准化组织队形图(支持多种符号表示)
 * - 标准化列表格式(有序、无序)
 */

/**
 * 格式化教案响应内容，确保标题和组织队形图等格式一致
 * @param {string} response - AI生成的原始响应
 * @returns {string} - 格式化后的响应
 */
const formatResponse = (response) => {
  if (!response) return '';
  
  // 预处理：统一中英文冒号
  let formatted = response.replace(/：/g, ':');
  
  // 标准化标题格式
  formatted = standardizeTitles(formatted);
  
  // 标准化组织队形图
  formatted = standardizeOrganizationCharts(formatted);
  
  // 标准化列表格式
  formatted = standardizeLists(formatted);
  
  return formatted;
};

/**
 * 标准化列表格式
 * @param {string} text - 原始文本
 * @returns {string} - 列表格式化后的文本
 */
const standardizeLists = (text) => {
  let processed = text;
  
  // 确保有序列表格式一致，数字后接一个点和空格
  processed = processed.replace(/^(\s*)(\d+)([.．])\s*/gm, '$1$2. ');
  
  // 确保无序列表格式一致，使用-加空格
  processed = processed.replace(/^(\s*)[\*\-•●]\s+/gm, '$1- ');
  
  return processed;
};

/**
 * 标准化标题格式
 * @param {string} text - 原始文本
 * @returns {string} - 标题格式化后的文本
 */
const standardizeTitles = (text) => {
  // 确保标题格式一致 (# 标题)和(## 标题)等
  return text.replace(/^(#{1,4})\s*([^#\n]+)/gm, (match, hashes, title) => {
    // 确保标题与#号之间有一个空格，且标题前后没有多余空格
    return `${hashes} ${title.trim()}`;
  });
};

/**
 * 标准化组织队形图
 * @param {string} text - 原始文本
 * @returns {string} - 队形图格式化后的文本
 */
const standardizeOrganizationCharts = (text) => {
  // 识别可能是组织队形图的段落，支持更多可能的分隔方式和结束标记
  return text.replace(/(组织[形队]式:[\s\S]*?)(?=(\n\s*[时课]间:)|(\n\s*运动负荷:)|(\n\s*#{1,4}\s)|(\n\s*\d+\.\s)|(\n\s*$))/gm, (match) => {
    // 检查是否包含队形符号，支持原始符号和替代符号
    if (match.includes('●') || match.includes('▲') || match.includes('→') ||
        match.includes('O') || match.includes('△') || match.includes('->')) {
      // 提取图表部分并标准化
      return formatChartSection(match);
    }
    return match;
  });
};

/**
 * 格式化队形图部分
 * @param {string} section - 包含队形图的部分
 * @returns {string} - 格式化后的队形图部分
 */
const formatChartSection = (section) => {
  // 分离标题和内容，支持「组织形式」和「组织队式」两种标题
  const titleMatch = section.match(/组织[形队]式:?\s*/);
  if (!titleMatch) return section;
  
  const title = titleMatch[0];
  let content = section.substring(titleMatch[0].length);
  
  // 按行拆分
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  
  // 队形符号映射，将替代符号标准化为首选符号
  const symbolMap = {
    'O': '●',  // 圆圈O映射到黑色圆点
    '△': '▲',  // 空心三角形映射到实心三角形
    '->': '→'   // ->映射到箭头
  };
  
  // 识别图形行（包含队形符号的行）
  const chartLines = [];
  const textLines = [];
  
  lines.forEach(line => {
    // 检查是否包含任何类型的队形符号
    if (line.includes('●') || line.includes('▲') || line.includes('→') ||
        line.includes('O') || line.includes('△') || line.includes('->')) {
      chartLines.push(line);
    } else {
      textLines.push(line);
    }
  });
  
  // 标准化图形行，确保符号间距均匀并将替代符号转换为标准符号
  const standardizedChartLines = chartLines.map(line => {
    // 首先替换替代符号
    let standardized = line;
    for (const [alt, std] of Object.entries(symbolMap)) {
      standardized = standardized.replace(new RegExp(alt, 'g'), std);
    }
    
    // 然后确保符号间距均匀，为每个符号后添加两个空格
    return standardized.replace(/([●▲→])\s*/g, '$1  ').trim();
  });
  
  // 重新组合
  let result = title + '\n\n';
  
  if (standardizedChartLines.length > 0) {
    result += standardizedChartLines.join('\n') + '\n\n';
  }
  
  if (textLines.length > 0) {
    result += textLines.join('\n');
  }
  
  return result.trim();
};

module.exports = {
  formatResponse
};
