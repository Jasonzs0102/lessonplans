/**
 * 文件: client/src/components/ResultSection.tsx
 * 
 * 结果展示组件 - 显示生成的教案内容
 * 
 * 组件接口:
 * - ResultSection: 富文本教案内容的展示和交互
 * 
 * 功能:
 * - 展示生成的Markdown格式教案内容
 * - 加载状态和错误处理
 * - 复制内容到剪贴板
 * - 下载Markdown文件
 * - 增强队形图符号的展示
 */
import React, { useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { useLanguage } from '../contexts/LanguageContext';

interface ResultSectionProps {
  content: string;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
}

/**
 * 预处理教案内容，增强格式一致性
 * @param rawContent 原始教案内容
 * @returns 预处理后的标准化内容
 * 
 * 功能：
 * - 标准化标题格式（确保#后有空格）
 */
const preprocessContent = (rawContent: string): string => {
  if (!rawContent) return '';
  
  // 处理标题格式，确保#后有空格
  let processed = rawContent.replace(/^(#{1,4})\s*([^#\n]+)/gm, (_match, hashes, title) => {
    return `${hashes} ${title.trim()}`;
  });
  
  // 优化课的结构部分，确保正确嵌套
  processed = processed.replace(
    /((?:##\s*课的结构|##\s*教学过程)[\s\S]*?)(?=##\s|$)/gm,
    (structureSection) => {
      // 修复重复的阶段名称问题
      let fixed = structureSection.replace(
        /(###\s*(?:准备部分|基本部分|结束部分)[^\n]*)[\s\S]*?阶段名称[：:]\s*(?:准备部分|基本部分|结束部分)/gm,
        '$1'
      );
      
      // 确保子部分正确嵌套显示为h4
      fixed = fixed.replace(
        /(?<=###\s*(?:基本部分)[^\n]*\n+)[^#\n]*?((?:课堂引入|(?:组织|队形)变化|教学内容|技术要点|(?:教学|练习)方法)[：:])/gm,
        '#### $1'
      );
      
      return fixed;
    }
  );
  
  return processed;
};

const ResultSection: React.FC<ResultSectionProps> = ({ 
  content, 
  isLoading, 
  isError,
  errorMessage 
}) => {
  const { t } = useLanguage();
  const resultRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef<boolean>(false);
  const lastContentRef = useRef<string>('');
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 监听用户滚动操作
  const handleScroll = () => {
    if (!resultRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = resultRef.current;
    // 如果用户已手动向上滚动（离底部超过100px），标记为手动滚动状态
    userScrolledRef.current = scrollHeight - scrollTop - clientHeight > 100;
    
    // 如果用户滚动到了底部，重置手动滚动状态
    if (scrollHeight - scrollTop - clientHeight < 20) {
      userScrolledRef.current = false;
    }
  };

  // 滚动到底部函数
  const scrollToBottom = useCallback(() => {
    if (resultRef.current && !userScrolledRef.current) {
      resultRef.current.scrollTop = resultRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    // 当内容变化且内容比上次更多时
    if (content && content !== lastContentRef.current) {
      lastContentRef.current = content;
      
      // 使用setTimeout确保DOM更新后再滚动
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        scrollToBottom();
        scrollTimeoutRef.current = null;
      }, 50);
    }
    
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [content, scrollToBottom]);

  useEffect(() => {
    // 组件挂载时添加滚动指示器
    const resultElement = resultRef.current;
    if (resultElement) {
      // 添加视觉指示器，当有新内容但用户滚动了时提示
      const indicator = document.createElement('div');
      indicator.className = 'fixed bottom-8 right-8 bg-crimson-500 text-white rounded-full p-2 shadow-lg cursor-pointer hidden';
      indicator.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      `;
      indicator.onclick = () => {
        userScrolledRef.current = false;
        scrollToBottom();
        indicator.classList.add('hidden');
      };
      
      document.body.appendChild(indicator);
      
      // 检测是否需要显示指示器
      const checkScroll = () => {
        if (resultElement && userScrolledRef.current && content.length > 0) {
          indicator.classList.remove('hidden');
        } else {
          indicator.classList.add('hidden');
        }
      };
      
      const scrollInterval = setInterval(checkScroll, 500);
      
      return () => {
        clearInterval(scrollInterval);
        document.body.removeChild(indicator);
      };
    }
  }, [content.length, scrollToBottom]);

  // 复制内容到剪贴板
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      alert('教案内容已复制到剪贴板！');
    } catch (err) {
      console.error('复制失败:', err);
      alert('复制失败，请手动选择并复制。');
    }
  };

  // 下载教案为Markdown文件
  const downloadMarkdown = () => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    
    // 生成文件名：体育教案-年级-项目-时间戳
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    element.download = `体育教案-${timestamp}.md`;
    
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="result-container flex flex-col h-full">
      <div className="result-header">
        <h2 className="text-lg font-semibold text-gray-900">{t('result.title')}</h2>
        
        {content && !isLoading && (
          <div className="flex space-x-2">
            <button 
              onClick={copyToClipboard}
              className="inline-flex items-center justify-center h-8 px-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-crimson-500 focus:ring-offset-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {t('result.copy')}
            </button>
            <button 
              onClick={downloadMarkdown}
              className="inline-flex items-center justify-center h-8 px-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-crimson-500 focus:ring-offset-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t('result.download')}
            </button>
          </div>
        )}
      </div>

      {isError && (
        <div className="bg-red-50 p-4 mb-4 mx-4 mt-4 rounded-xl border border-red-100 shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {errorMessage ? t('error.message').replace('{message}', errorMessage) : t('error.unknown')}
              </p>
            </div>
          </div>
        </div>
      )}

      <div 
        ref={resultRef}
        onScroll={handleScroll}
        className={`bg-white h-[600px] overflow-y-auto flex-grow ${isLoading ? '' : ''}`}
      >
        {isLoading && !content && (
          <div className="flex flex-col justify-center items-center h-full">
            <div className="text-center space-y-4">
              <div className="animate-pulse flex space-x-2">
                <div className="animate-bounce h-3 w-3 bg-crimson-500 rounded-full"></div>
                <div className="animate-bounce h-3 w-3 bg-crimson-500 rounded-full" style={{ animationDelay: '0.2s' }}></div>
                <div className="animate-bounce h-3 w-3 bg-crimson-500 rounded-full" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <p className="text-gray-500 text-sm">{t('result.loading')}</p>
            </div>
          </div>
        )}

        {!isLoading && !content && !isError && (
          <div className="flex flex-col justify-center items-center h-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-400 text-sm">{t('result.empty')}</p>
          </div>
        )}

        {content && (
          <div className="prose prose-gray max-w-none p-6 leading-relaxed">
            <ReactMarkdown 
              rehypePlugins={[rehypeRaw]}
              components={{
                // 增强标题显示 - 使用crimson颜色并强制应用
                h1: ({node, ...props}) => <h1 style={{color: '#AC1C35'}} className="text-2xl font-bold mt-6 mb-4 pb-2 border-b border-gray-200 !text-crimson-700" {...props} />,
                h2: ({node, ...props}) => <h2 style={{color: '#AC1C35'}} className="text-xl font-semibold mt-5 mb-3 pb-1 border-b border-gray-100 !text-crimson-700" {...props} />,
                h3: ({node, ...props}) => <h3 style={{color: '#AC1C35'}} className="text-lg font-medium mt-4 mb-2 !text-crimson-600" {...props} />,
                h4: ({node, ...props}) => <h4 style={{color: '#AC1C35'}} className="text-base font-medium mt-3 mb-1 !text-crimson-600" {...props} />,
                
                // 特殊处理组织队形图
                p: ({node, children, ...props}) => {
                  // 检测是否为组织队形图
                  const content = String(children);
                  if (content.includes('●') || content.includes('▲') || content.includes('→')) {
                    return (
                      <div className="my-3 p-3 bg-gray-50 rounded-md font-mono text-sm whitespace-pre overflow-x-auto">
                        {content.split('\n').map((line, i) => (
                          <div key={i} className="flex items-center gap-1">
                            {line.split('').map((char, j) => {
                              if (char === '●') {
                                return <span key={j} className="text-crimson-500">●</span>;
                              } else if (char === '▲') {
                                return <span key={j} className="text-red-500">▲</span>;
                              } else if (char === '→') {
                                return <span key={j} className="text-green-500">→</span>;
                              } else {
                                return <span key={j}>{char}</span>;
                              }
                            })}
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return <p {...props}>{children}</p>;
                },
                
                // 强化列表显示
                ul: ({node, ...props}) => <ul className="list-disc pl-6 my-3" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-6 my-3" {...props} />,
                li: ({node, ...props}) => <li className="my-1" {...props} />
              }}
            >
              {preprocessContent(content)}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultSection;
