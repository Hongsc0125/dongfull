import express from 'express';
import logger from '../../utils/logger.js';

const router = express.Router();

// 클라이언트에서 로그 수신
router.post('/', (req, res) => {
    try {
        const { level, message, context, timestamp, userAgent, url } = req.body;
        
        const logContext = {
            ...context,
            source: 'client',
            userAgent,
            url,
            clientTimestamp: timestamp
        };
        
        // 로그 레벨에 따라 적절한 로거 함수 호출
        switch (level) {
            case 'error':
                logger.error(`[CLIENT] ${message}`, logContext);
                break;
            case 'warn':
                logger.warn(`[CLIENT] ${message}`, logContext);
                break;
            case 'info':
                logger.info(`[CLIENT] ${message}`, logContext);
                break;
            case 'debug':
                logger.debug(`[CLIENT] ${message}`, logContext);
                break;
            default:
                logger.info(`[CLIENT] ${message}`, logContext);
        }
        
        res.status(200).json({ success: true });
    } catch (error) {
        logger.error('Failed to process client log', { error: error.message });
        res.status(500).json({ error: 'Failed to process log' });
    }
});

// 서버 로그 조회 (개발용)
router.get('/', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Not available in production' });
    }
    
    // 개발 환경에서만 로그 파일 내용을 반환할 수 있습니다
    res.json({ message: 'Use log files in logs/ directory' });
});

export default router;