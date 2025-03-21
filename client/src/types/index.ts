/**
 * 定义前端应用的类型声明
 */

// 教案生成参数类型
export interface LessonPlanParams {
  grade: string;         // 年级
  duration: string;      // 课程时长
  sportType: string;     // 运动项目
  studentCount: string;  // 学生人数
  teachingContent: string; // 教学内容
  requirements?: string; // 补充要求（可选）
}

// API请求参数类型
export interface GenerateRequestData {
  data: LessonPlanParams;
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// SSE事件类型
export interface StreamChunk {
  content?: string;
  done?: boolean;
  error?: string;
}
