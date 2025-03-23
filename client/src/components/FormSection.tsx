/**
 * 参数采集表单组件
 */
import React from 'react';
import { useForm } from 'react-hook-form';
import { LessonPlanParams } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface FormSectionProps {
  onSubmit: (data: LessonPlanParams) => void;
  isLoading: boolean;
  showResult?: boolean;
}

const FormSection: React.FC<FormSectionProps> = ({ onSubmit, isLoading, showResult = false }) => {
  const { t } = useLanguage();
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
        <h2 className="text-xl font-semibold text-white">{t('form.title')}</h2>
      </div>
      <div className="form-body">
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 水平与年级选择 */}
          <div>
            <label className="form-label" htmlFor="grade">
              {t('form.grade')} <span className="text-red-500">*</span>
            </label>
            <select
              id="grade"
              className="form-input"
              {...register('grade', { required: '请选择水平与年级' })}
            >
              <option value="">{t('form.grade.placeholder')}</option>
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
              {t('form.duration')}
            </label>
            <input
              id="duration"
              type="number"
              className="form-input"
              min="10"
              max="120"
              {...register('duration', { required: true, min: 10, max: 120 })}
            />
          </div>
        </div>

        {/* 体育项目 */}
        <div>
          <label className="form-label" htmlFor="sportType">
            {t('form.sportType')} <span className="text-red-500">*</span>
          </label>
          <select
            id="sportType"
            className="form-input"
            {...register('sportType', { required: '请选择体育项目' })}
          >
            <option value="">{t('form.sportType.placeholder')}</option>
            <option value="篮球">篮球</option>
            <option value="足球">足球</option>
            <option value="排球">排球</option>
            <option value="田径">田径</option>
            <option value="体操">体操</option>
            <option value="武术">武术</option>
            <option value="游泳">游泳</option>
            <option value="乒乓球">乒乓球</option>
            <option value="羽毛球">羽毛球</option>
            <option value="健康教育">健康教育</option>
            <option value="体能训练">体能训练</option>
            <option value="趣味体育">趣味体育</option>
            <option value="民族传统体育">民族传统体育</option>
          </select>
          {errors.sportType && <p className="form-error">{errors.sportType.message}</p>}
        </div>

        {/* 学生人数 */}
        <div>
          <label className="form-label" htmlFor="studentCount">
            {t('form.studentCount')}
          </label>
          <input
            id="studentCount"
            type="number"
            className="form-input"
            min="1"
            max="100"
            {...register('studentCount', { required: true, min: 1, max: 100 })}
          />
        </div>

        {/* 教学内容 */}
        <div>
          <label className="form-label" htmlFor="teachingContent">
            {t('form.teachingContent')} <span className="text-red-500">*</span>
          </label>
          <textarea
            id="teachingContent"
            rows={3}
            className="form-input"
            placeholder={t('form.teachingContent.placeholder')}
            {...register('teachingContent', { required: '请输入教学内容' })}
          ></textarea>
          {errors.teachingContent && <p className="form-error">{errors.teachingContent.message}</p>}
        </div>

        {/* 特殊要求 */}
        <div>
          <label className="form-label" htmlFor="requirements">
            {t('form.requirements')}
          </label>
          <textarea
            id="requirements"
            rows={3}
            className="form-input"
            placeholder={t('form.requirements.placeholder')}
            {...register('requirements')}
          ></textarea>
        </div>

        {/* 提交按钮 */}
        <div className="flex justify-center mt-8">
          <button
            type="submit"
            className="btn-primary flex items-center px-6 py-3 text-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('form.submitting')}
              </>
            ) : (
              t('form.submit')
            )}
          </button>
        </div>
      </form>
      
      </div>
    </div>
  );
};

export default FormSection;
