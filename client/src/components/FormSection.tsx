/**
 * 参数采集表单组件
 */
import React from 'react';
import { useForm } from 'react-hook-form';
import { LessonPlanParams } from '../types';

interface FormSectionProps {
  onSubmit: (data: LessonPlanParams) => void;
  isLoading: boolean;
  showResult?: boolean;
}

const FormSection: React.FC<FormSectionProps> = ({ onSubmit, isLoading, showResult = false }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<LessonPlanParams>({
    defaultValues: {
      grade: '',
      duration: '40',
      sportType: '',
      studentCount: '30',
      teachingContent: '',
      requirements: ''
    }
  });

  return (
    <div className={`form-container ${showResult ? '' : 'max-w-2xl mx-auto'} transition-all duration-500`}>
      <div className="form-header">
        <h2 className="text-xl font-semibold text-white">教案参数设置</h2>
      </div>
      <div className="form-body">
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 水平与年级选择 */}
          <div>
            <label className="form-label" htmlFor="grade">
              水平与年级 <span className="text-red-500">*</span>
            </label>
            <select
              id="grade"
              className="form-input"
              {...register('grade', { required: '请选择水平与年级' })}
            >
              <option value="">请选择水平与年级</option>
              <option value="水平一（1年级）">水平一（1年级）</option>
              <option value="水平一（2年级）">水平一（2年级）</option>
              <option value="水平二（3年级）">水平二（3年级）</option>
              <option value="水平二（4年级）">水平二（4年级）</option>
              <option value="水平三（5年级）">水平三（5年级）</option>
              <option value="水平三（6年级）">水平三（6年级）</option>
              <option value="水平四（初一）">水平四（初一）</option>
              <option value="水平四（初二）">水平四（初二）</option>
              <option value="水平四（初三）">水平四（初三）</option>
              <option value="水平五（高一）">水平五（高一）</option>
              <option value="水平五（高二）">水平五（高二）</option>
              <option value="水平五（高三）">水平五（高三）</option>
            </select>
            {errors.grade && <p className="form-error">{errors.grade.message}</p>}
          </div>

          {/* 课程时长 */}
          <div>
            <label className="form-label" htmlFor="duration">
              课程时长(分钟) <span className="text-red-500">*</span>
            </label>
            <input
              id="duration"
              type="number"
              className="form-input"
              {...register('duration', { 
                required: '请输入课程时长',
                min: { value: 10, message: '课程时长不能小于10分钟' },
                max: { value: 120, message: '课程时长不能超过120分钟' }
              })}
            />
            {errors.duration && <p className="form-error">{errors.duration.message}</p>}
          </div>

          {/* 运动项目 */}
          <div>
            <label className="form-label" htmlFor="sportType">
              运动项目 <span className="text-red-500">*</span>
            </label>
            <select
              id="sportType"
              className="form-input"
              {...register('sportType', { required: '请选择运动项目' })}
            >
              <option value="">请选择运动项目</option>
              <option value="篮球">篮球</option>
              <option value="足球">足球</option>
              <option value="排球">排球</option>
              <option value="乒乓球">乒乓球</option>
              <option value="羽毛球">羽毛球</option>
              <option value="田径">田径</option>
              <option value="体操">体操</option>
              <option value="武术">武术</option>
              <option value="游泳">游泳</option>
              <option value="健美操">健美操</option>
              <option value="跳绳">跳绳</option>
              <option value="广播体操">广播体操</option>
              <option value="体能训练">体能训练</option>
            </select>
            {errors.sportType && <p className="form-error">{errors.sportType.message}</p>}
          </div>

          {/* 学生人数 */}
          <div>
            <label className="form-label" htmlFor="studentCount">
              学生人数 <span className="text-red-500">*</span>
            </label>
            <input
              id="studentCount"
              type="number"
              className="form-input"
              {...register('studentCount', { 
                required: '请输入学生人数',
                min: { value: 1, message: '学生人数不能小于1' },
                max: { value: 100, message: '学生人数不能超过100' }
              })}
            />
            {errors.studentCount && <p className="form-error">{errors.studentCount.message}</p>}
          </div>
        </div>

        {/* 教学内容 */}
        <div>
          <label className="form-label" htmlFor="teachingContent">
            教学内容 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="teachingContent"
            className="form-input h-24"
            placeholder="请详细描述教学内容，如篮球运球技巧、足球传球练习等"
            {...register('teachingContent', { 
              required: '请输入教学内容',
              minLength: { value: 2, message: '教学内容不能少于2个字符' }
            })}
          />
          {errors.teachingContent && <p className="form-error">{errors.teachingContent.message}</p>}
        </div>

        {/* 补充要求 */}
        <div>
          <label className="form-label" htmlFor="requirements">
            补充要求 (可选)
          </label>
          <textarea
            id="requirements"
            className="form-input h-24"
            placeholder="如有特殊要求，请在此说明，如学生特点、教学重点等"
            {...register('requirements')}
          />
          {errors.requirements && <p className="form-error">{errors.requirements.message}</p>}
        </div>

        <div className="pt-6">
          <button 
            type="submit" 
            className="w-full py-3 text-base font-medium bg-gradient-to-r from-crimson-600 to-crimson-700 hover:from-crimson-700 hover:to-crimson-800 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                生成中...
              </span>
            ) : '生成教案'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default FormSection;
