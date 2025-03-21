import { useState, useEffect } from 'react'
import './App.css'
import FormSection from './components/FormSection'
import ResultSection from './components/ResultSection'
import { LessonPlanParams } from './types'
import { generateLessonPlanStream } from './services/api'
import { motion, AnimatePresence } from 'framer-motion'

function App() {
  // 状态管理
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showResult, setShowResult] = useState(false)
  
  // 当有内容时，显示结果区域
  useEffect(() => {
    if (content.length > 0 && !showResult) {
      setShowResult(true)
    }
  }, [content])

  // 处理表单提交
  const handleSubmit = (data: LessonPlanParams) => {
    // 重置状态
    setContent('')
    setIsError(false)
    setErrorMessage('')
    setIsLoading(true)
    
    // 调用API生成教案
    generateLessonPlanStream(
      data,
      // 进度回调 - 更新内容
      (chunk) => {
        setContent(prevContent => prevContent + chunk)
      },
      // 完成回调
      () => {
        setIsLoading(false)
      },
      // 错误回调
      (error) => {
        setIsLoading(false)
        setIsError(true)
        setErrorMessage(error)
      }
    )
  }

  return (
    <div className="min-h-screen py-8 app-container">
      <div className="container mx-auto px-4 max-w-6xl relative">
        {/* 头部 */}
        <header className="mb-8 text-center transition-all duration-500 ease-out">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">AI体育教案生成系统</h1>
          <div className="bg-gradient-to-r from-crimson-600 to-crimson-700 h-1 w-24 mx-auto mb-4 rounded-full"></div>
          <p className="text-gray-500">智能生成符合体育与健康新课标的体育课教案</p>
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
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} AI体育教案生成系统 | 使用先进AI技术提供支持</p>
        </footer>
      </div>
    </div>
  )
}

export default App
