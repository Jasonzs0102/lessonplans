import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Language, LanguageContextType, Translations } from '../types';

// 翻译内容定义
const translations: Translations = {
  'app.title': {
    zh: 'AI体育教案生成系统',
    en: 'AI Sports Lesson Plan Generator',
    ru: 'Генератор планов уроков по физкультуре'
  },
  'app.subtitle': {
    zh: '智能生成符合体育与健康新课标的体育课教案',
    en: 'Intelligently generate sports lesson plans compliant with new PE standards',
    ru: 'Интеллектуальная генерация планов уроков физкультуры в соответствии с новыми стандартами'
  },
  'form.title': {
    zh: '教案参数设置',
    en: 'Lesson Plan Parameters',
    ru: 'Параметры плана урока'
  },
  'form.grade': {
    zh: '水平与年级',
    en: 'Level and Grade',
    ru: 'Уровень и класс'
  },
  'form.grade.placeholder': {
    zh: '请选择水平与年级',
    en: 'Please select level and grade',
    ru: 'Пожалуйста, выберите уровень и класс'
  },
  'form.duration': {
    zh: '课程时长（分钟）',
    en: 'Lesson Duration (minutes)',
    ru: 'Продолжительность урока (минуты)'
  },
  'form.sportType': {
    zh: '体育项目',
    en: 'Sports Type',
    ru: 'Вид спорта'
  },
  'form.sportType.placeholder': {
    zh: '请选择体育项目',
    en: 'Please select sports type',
    ru: 'Пожалуйста, выберите вид спорта'
  },
  'form.studentCount': {
    zh: '学生人数',
    en: 'Student Count',
    ru: 'Количество учеников'
  },
  'form.teachingContent': {
    zh: '教学内容',
    en: 'Teaching Content',
    ru: 'Содержание обучения'
  },
  'form.teachingContent.placeholder': {
    zh: '请输入本课教学内容，如：篮球运球、足球传球等',
    en: 'Please enter teaching content for this lesson, e.g., basketball dribbling, football passing, etc.',
    ru: 'Пожалуйста, введите содержание обучения для этого урока, например, ведение мяча в баскетболе, передача мяча в футболе и т.д.'
  },
  'form.requirements': {
    zh: '特殊要求（可选）',
    en: 'Special Requirements (Optional)',
    ru: 'Особые требования (необязательно)'
  },
  'form.requirements.placeholder': {
    zh: '请输入特殊要求，如：场地限制、器材限制等',
    en: 'Please enter special requirements, e.g., venue restrictions, equipment limitations, etc.',
    ru: 'Пожалуйста, введите особые требования, например, ограничения по площадке, ограничения по оборудованию и т.д.'
  },
  'form.submit': {
    zh: '生成教案',
    en: 'Generate Lesson Plan',
    ru: 'Создать план урока'
  },
  'form.submitting': {
    zh: '生成中...',
    en: 'Generating...',
    ru: 'Создание...'
  },
  'result.title': {
    zh: '教案内容',
    en: 'Lesson Plan Content',
    ru: 'Содержание плана урока'
  },
  'result.copy': {
    zh: '复制',
    en: 'Copy',
    ru: 'Копировать'
  },
  'result.download': {
    zh: '下载',
    en: 'Download',
    ru: 'Скачать'
  },
  'result.loading': {
    zh: '正在生成教案，请稍候...\n这可能需要一分钟左右',
    en: 'Generating lesson plan, please wait...\nThis may take about a minute',
    ru: 'Создание плана урока, пожалуйста, подождите...\nЭто может занять около минуты'
  },
  'result.empty': {
    zh: '填写参数并点击"生成教案"按钮开始生成',
    en: 'Fill in parameters and click "Generate Lesson Plan" to start',
    ru: 'Заполните параметры и нажмите "Создать план урока", чтобы начать'
  },
  'footer.copyright': {
    zh: '© {year} AI体育教案生成系统 | 使用先进AI技术提供支持',
    en: '© {year} AI Sports Lesson Plan Generator | Powered by advanced AI technology',
    ru: '© {year} Генератор планов уроков по физкультуре | На основе передовых технологий ИИ'
  },
  'language': {
    zh: '语言',
    en: 'Language',
    ru: 'Язык'
  },
  'language.chinese': {
    zh: '中文',
    en: 'Chinese',
    ru: 'Китайский'
  },
  'language.english': {
    zh: '英文',
    en: 'English',
    ru: 'Английский'
  },
  'language.russian': {
    zh: '俄语',
    en: 'Russian',
    ru: 'Русский'
  },
  'error.message': {
    zh: '生成教案时出错: {message}',
    en: 'Error generating lesson plan: {message}',
    ru: 'Ошибка при создании плана урока: {message}'
  },
  'error.unknown': {
    zh: '未知错误，请稍后重试',
    en: 'Unknown error, please try again later',
    ru: 'Неизвестная ошибка, пожалуйста, попробуйте позже'
  },
  'contact.email': {
    zh: '联系邮箱',
    en: 'Contact Email',
    ru: 'Контактная почта'
  },
  'contact.message': {
    zh: '欢迎合作，来信请注明具体来意',
    en: 'Welcome to collaborate, please specify your purpose when contacting',
    ru: 'Приглашаем к сотрудничеству, пожалуйста, укажите цель при обращении'
  }
};

// 创建语言上下文
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 语言上下文提供组件
export const LanguageProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('zh'); // 默认中文

  // 翻译函数
  const t = (key: string): string => {
    const translationObj = translations[key];
    if (!translationObj) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }

    let text = translationObj[language];
    
    // 替换变量，例如 {year}
    if (text.includes('{year}')) {
      text = text.replace('{year}', String(new Date().getFullYear()));
    }
    
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// 使用语言上下文的钩子
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 