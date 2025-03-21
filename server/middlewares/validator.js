/**
 * 参数验证中间件
 */
const { z } = require('zod');

// 创建参数验证模式
const paramSchema = z.object({
  data: z.object({
    grade: z.string().min(1, '年级不能为空'),
    duration: z.string().min(1, '课程时长不能为空'),
    sportType: z.string().min(1, '运动项目不能为空'),
    studentCount: z.string().min(1, '学生人数不能为空'),
    teachingContent: z.string().min(1, '教学内容不能为空'),
    requirements: z.string().optional()
  })
});

/**
 * 验证请求参数
 * @param {Object} params - 请求参数
 * @returns {Object} 验证结果
 */
const validateParams = (params) => {
  try {
    const validatedData = paramSchema.parse(params);
    return {
      success: true,
      data: validatedData.data
    };
  } catch (error) {
    return {
      success: false,
      errors: error.errors
    };
  }
};

module.exports = {
  validateParams
};
