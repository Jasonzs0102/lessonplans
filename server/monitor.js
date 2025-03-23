/**
 * 后端服务监控脚本
 * 监控并在必要时重启Node.js后端服务
 */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

// 配置项
const CONFIG = {
  // 服务器配置
  serverCommand: 'node',
  serverScript: 'index.js',
  serverPort: process.env.PORT || 5001,
  
  // 监控配置
  checkInterval: 30000, // 30秒检查一次
  restartDelay: 5000,   // 重启前等待5秒
  maxRestarts: 5,       // 24小时内最大重启次数
  resetCounterAfter: 24 * 60 * 60 * 1000, // 24小时后重置计数器
  
  // 日志配置
  logFile: path.join(__dirname, 'monitor.log'),
  enableConsoleLog: true,
  enableFileLog: true,
};

// 状态跟踪
let serverProcess = null;
let restartCount = 0;
let lastRestartTime = Date.now();

/**
 * 记录日志
 * @param {string} message - 日志消息
 * @param {string} level - 日志级别 (info, warn, error)
 */
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  // 控制台日志
  if (CONFIG.enableConsoleLog) {
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    console[consoleMethod](logMessage);
  }
  
  // 文件日志
  if (CONFIG.enableFileLog) {
    try {
      fs.appendFileSync(CONFIG.logFile, logMessage + '\n');
    } catch (error) {
      console.error(`无法写入日志文件: ${error.message}`);
    }
  }
}

/**
 * 启动服务器进程
 */
function startServer() {
  try {
    log('正在启动服务器...');
    
    // 启动服务器进程
    serverProcess = spawn(CONFIG.serverCommand, [CONFIG.serverScript], {
      cwd: __dirname,
      env: process.env,
      stdio: 'pipe', // 捕获标准输出和错误
    });
    
    // 处理进程输出
    serverProcess.stdout.on('data', (data) => {
      log(`服务器输出: ${data.toString().trim()}`);
    });
    
    serverProcess.stderr.on('data', (data) => {
      log(`服务器错误: ${data.toString().trim()}`, 'error');
    });
    
    // 处理进程退出
    serverProcess.on('exit', (code, signal) => {
      const exitReason = signal ? `信号 ${signal}` : `退出码 ${code}`;
      log(`服务器进程已退出 (${exitReason})`, code !== 0 ? 'error' : 'info');
      serverProcess = null;
      
      // 检查是否需要重启
      handleUnexpectedExit(code, signal);
    });
    
    // 处理进程错误
    serverProcess.on('error', (error) => {
      log(`启动服务器时发生错误: ${error.message}`, 'error');
      serverProcess = null;
    });
    
    log('服务器启动命令已执行');
  } catch (error) {
    log(`启动服务器进程失败: ${error.message}`, 'error');
  }
}

/**
 * 检查服务器健康状态
 * @returns {Promise<boolean>} 服务器是否健康
 */
async function checkServerHealth() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: CONFIG.serverPort,
      path: '/health',  // 假设有一个健康检查端点
      method: 'GET',
      timeout: 5000,    // 5秒超时
    };
    
    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            // 尝试解析JSON响应
            const response = JSON.parse(data);
            log(`健康检查成功: ${JSON.stringify(response)}`);
            resolve(true);
          } catch (error) {
            log(`解析健康检查响应失败: ${error.message}`, 'warn');
            resolve(true); // 状态码为200就认为是健康的，即使无法解析JSON
          }
        });
      } else {
        log(`健康检查失败: 状态码 ${res.statusCode}`, 'warn');
        resolve(false);
      }
    });
    
    req.on('error', (error) => {
      log(`健康检查请求失败: ${error.message}`, 'warn');
      resolve(false);
    });
    
    req.on('timeout', () => {
      log('健康检查请求超时', 'warn');
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

/**
 * 重启服务器
 */
function restartServer() {
  // 更新重启计数
  restartCount++;
  lastRestartTime = Date.now();
  
  log(`正在重启服务器 (第 ${restartCount} 次尝试)...`);
  
  // 如果服务器进程仍在运行，先停止它
  if (serverProcess) {
    try {
      log('正在终止当前服务器进程...');
      serverProcess.kill('SIGTERM');
      
      // 给进程一些时间正常关闭
      setTimeout(() => {
        if (serverProcess) {
          try {
            log('尝试强制终止服务器进程...');
            serverProcess.kill('SIGKILL');
          } catch (error) {
            log(`强制终止服务器进程失败: ${error.message}`, 'error');
          }
        }
      }, 5000);
    } catch (error) {
      log(`终止服务器进程失败: ${error.message}`, 'error');
    }
  }
  
  // 延迟后启动新进程
  setTimeout(() => {
    startServer();
  }, CONFIG.restartDelay);
}

/**
 * 处理意外进程退出
 */
function handleUnexpectedExit(code, signal) {
  // 如果是正常退出（退出码为0且没有信号），不自动重启
  if (code === 0 && !signal) {
    log('服务器正常退出，不自动重启');
    return;
  }
  
  // 检查24小时内重启次数
  const now = Date.now();
  if (now - lastRestartTime > CONFIG.resetCounterAfter) {
    log('重启计数器已重置');
    restartCount = 0;
  }
  
  // 检查是否超过最大重启次数
  if (restartCount >= CONFIG.maxRestarts) {
    log(`已达到最大重启次数 (${CONFIG.maxRestarts})，不再自动重启`, 'error');
    return;
  }
  
  log(`服务器异常退出，准备重启...`);
  restartServer();
}

/**
 * 主监控循环
 */
async function monitorLoop() {
  try {
    // 如果服务器进程不存在，启动它
    if (!serverProcess) {
      log('未检测到服务器进程，正在启动...');
      startServer();
    } else {
      // 检查服务器健康状态
      const isHealthy = await checkServerHealth();
      
      if (!isHealthy) {
        log('服务器健康检查失败，准备重启...', 'warn');
        restartServer();
      } else {
        log('服务器运行正常');
      }
    }
  } catch (error) {
    log(`监控循环发生错误: ${error.message}`, 'error');
  }
  
  // 安排下一次检查
  setTimeout(monitorLoop, CONFIG.checkInterval);
}

/**
 * 清理函数，在进程退出时调用
 */
function cleanup() {
  log('监控脚本正在退出，正在清理资源...');
  
  if (serverProcess) {
    try {
      log('正在终止服务器进程...');
      serverProcess.kill('SIGTERM');
    } catch (error) {
      log(`终止服务器进程失败: ${error.message}`, 'error');
    }
  }
}

// 注册进程信号处理器
process.on('SIGINT', () => {
  log('收到 SIGINT 信号');
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('收到 SIGTERM 信号');
  cleanup();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  log(`未捕获的异常: ${error.message}`, 'error');
  log(error.stack, 'error');
  cleanup();
  process.exit(1);
});

// 启动监控
log('后端服务监控已启动');
monitorLoop();
