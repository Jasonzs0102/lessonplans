// 语言类型定义
export type Language = 'zh' | 'en' | 'ru';
export type Translations = {
  [key: string]: {
    [key in Language]: string;
  };
};

export interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
} 