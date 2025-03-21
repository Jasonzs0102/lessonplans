/**
 * 健康检查路由
 */
import express from 'express';
const router = express.Router();

// 健康检查接口
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: '服务正常运行中'
  });
});

export default router;
