import express from 'express';
import { getEventById } from '../../database/events.js';
import { getLeaderboard } from '../../database/participants.js';

const router = express.Router();

// 이벤트 상세 정보 + 리더보드를 한번에 조회 (최적화)
router.get('/:eventId/full', async (req, res) => {
    try {
        const { eventId } = req.params;
        
        // 병렬로 데이터 조회
        const [event, leaderboard] = await Promise.all([
            getEventById(eventId),
            getLeaderboard(eventId)
        ]);
        
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        res.json({
            event,
            leaderboard,
            stats: {
                participantCount: leaderboard.length,
                totalEntries: leaderboard.reduce((sum, p) => sum + (p.entry_count || 0), 0)
            }
        });
    } catch (error) {
        console.error('Error fetching event detail:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;