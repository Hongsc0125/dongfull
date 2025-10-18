import express from 'express';
import { getEventById } from '../../database/events.js';
import { getLeaderboard } from '../../database/participants.js';
import { getGuild } from '../../database/guilds.js';
import { db } from '../../database/init.js';

const router = express.Router();

// 공개 이벤트 정보 + 리더보드 조회 (인증 불필요)
router.get('/event/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        
        // 병렬로 데이터 조회
        const [event, leaderboard] = await Promise.all([
            getEventById(eventId),
            getLeaderboard(eventId, 50) // 상위 50명까지만
        ]);
        
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        // 길드 정보도 가져오기
        const guild = await getGuild(event.guild_id);
        if (guild) {
            event.guild_name = guild.guild_name;
        }
        
        // 민감한 정보 제거하되 avatar_url은 포함 (Discord 프로필 이미지용)
        const publicLeaderboard = leaderboard.map(participant => ({
            rank: participant.rank,
            display_name: participant.display_name,
            calculated_score: participant.calculated_score,
            total_score: participant.total_score,
            entry_count: participant.entry_count,
            avatar_url: participant.avatar_url,
            user_id: participant.user_id // Discord ID for avatar fallback
        }));
        
        res.json({
            event: {
                id: event.id,
                event_name: event.event_name,
                description: event.description,
                score_type: event.score_type,
                sort_direction: event.sort_direction,
                score_aggregation: event.score_aggregation,
                is_active: event.is_active,
                created_at: event.created_at,
                guild_name: event.guild_name
            },
            leaderboard: publicLeaderboard,
            stats: {
                participantCount: leaderboard.length,
                totalEntries: leaderboard.reduce((sum, p) => sum + (p.entry_count || 0), 0)
            }
        });
    } catch (error) {
        console.error('Error fetching public event data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 공개 이벤트 목록 조회 (활성 이벤트만)
router.get('/events', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                e.id,
                e.event_name,
                e.description,
                e.score_type,
                e.sort_direction,
                e.score_aggregation,
                e.created_at,
                g.guild_name,
                COUNT(p.id) as participant_count
            FROM events e
            LEFT JOIN guilds g ON e.guild_id = g.guild_id
            LEFT JOIN participants p ON e.id = p.event_id
            WHERE e.is_active = true
            GROUP BY e.id, g.guild_name
            ORDER BY e.created_at DESC
            LIMIT 20
        `);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching public events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;