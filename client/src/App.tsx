import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import FormSection from './components/FormSection'
import ResultSection from './components/ResultSection'
import LanguageSwitcher from './components/LanguageSwitcher'
import ContactInfo from './components/ContactInfo'
import { LessonPlanParams } from './types/index'
import { generateLessonPlanStream } from './services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from './contexts/LanguageContext'

function App() {
  const { t } = useLanguage();
  
  // 状态管理
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showResult, setShowResult] = useState(false)
  
  // 防止重复提交
  const isSubmitting = useRef(false)
  const lastSubmitTime = useRef(0)
  const MIN_SUBMIT_INTERVAL = 2000 // 最小提交间隔为2秒
  const cancelRequestRef = useRef<(() => void) | null>(null)
  
  // 当有内容时，显示结果区域
  useEffect(() => {
    if (content.length > 0 && !showResult) {
      setShowResult(true)
    }
  }, [content])

  // 处理表单提交 - 添加节流与锁定处理
  const handleSubmit = useCallback((data: LessonPlanParams) => {
    // 检查是否正在提交
    if (isSubmitting.current) {
      console.log('已有请求正在处理中，请等待...')
      return
    }
    
    // 检查时间间隔
    const now = Date.now()
    if (now - lastSubmitTime.current < MIN_SUBMIT_INTERVAL) {
      console.log('请求间隔过短，请稍后再试...')
      return
    }
    
    // 设置提交锁定
    isSubmitting.current = true
    lastSubmitTime.current = now
    
    // 重置状态
    setContent('')
    setIsError(false)
    setErrorMessage('')
    setIsLoading(true)
    
    // 调用API生成教案
    const cancelRequest = generateLessonPlanStream(
      data,
      // 进度回调 - 更新内容
      (chunk) => {
        setContent(chunk) // 直接使用API提供的完整内容，API内部已累加
      },
      // 完成回调
      (fullContent) => {
        setContent(fullContent)
        setIsLoading(false)
        isSubmitting.current = false // 解除提交锁定
        cancelRequestRef.current = null
      },
      // 错误回调
      (error) => {
        setIsLoading(false)
        setIsError(true)
        setErrorMessage(error)
        isSubmitting.current = false // 解除提交锁定
        cancelRequestRef.current = null
      }
    )
    
    // 保存取消请求函数
    cancelRequestRef.current = cancelRequest
    
    // 组件卸载时取消请求
    return () => {
      if (cancelRequestRef.current) {
        cancelRequestRef.current()
        cancelRequestRef.current = null
      }
    }
  }, []) // 移除节流，因为我们已经在函数内实现了锁定

  return (
    <div className="min-h-screen py-8 app-container">
      <div className="container mx-auto px-4 max-w-6xl relative">
        {/* 头部 */}
        <header className="mb-8 text-center transition-all duration-500 ease-out relative">
          {/* 语言切换按钮 */}
          <div className="absolute right-2 top-2">
            <LanguageSwitcher />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">{t('app.title')}</h1>
          <div className="bg-gradient-to-r from-crimson-600 to-crimson-700 h-1 w-24 mx-auto mb-4 rounded-full"></div>
          <p className="text-gray-500">{t('app.subtitle')}</p>
        </header>
        
        {/* 主体内容 */}
        <main className="flex flex-col lg:flex-row gap-6 relative min-h-[500px]">
          {/* 表单区域 - 动画容器 */}
          <motion.div 
            className={`${showResult ? 'lg:w-5/12' : 'w-full max-w-2xl mx-auto'} transition-all duration-500`}
            layout
            initial={{ opacity: 1 }}
            animate={{ 
              opacity: 1,
              x: showResult ? 0 : 0
            }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 30,
              opacity: { duration: 0.2 }
            }}
          >
            <FormSection onSubmit={handleSubmit} isLoading={isLoading} showResult={showResult} />
          </motion.div>
          
          {/* 结果展示区域 - 条件渲染和动画 */}
          <AnimatePresence>
            {showResult && (
              <motion.div 
                className="lg:w-7/12 rounded-2xl overflow-hidden shadow-xl bg-white border border-gray-100"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 300, 
                  damping: 30,
                  delay: 0.1 
                }}
              >
                <ResultSection 
                  content={content} 
                  isLoading={isLoading} 
                  isError={isError}
                  errorMessage={errorMessage}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        
        {/* 底部 */}
        <footer className="mt-16 text-center">
          <div className="bg-gradient-to-r from-gray-100 to-gray-200 h-px w-24 mx-auto mb-6 rounded-full"></div>
          <p className="text-gray-400 text-sm">{t('footer.copyright')}</p>
          <ContactInfo />
        </footer>
      </div>
    </div>
  )
}

export default App
