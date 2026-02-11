import express from 'express';
import { getGuilds, getGuild, addGuild } from '../../database/guilds.js';

const router = express.Router();

// 특정 길드 정보 조회 (최적화된 엔드포인트)
router.get('/:guildId', async (req, res) => {
    try {
        const { guildId } = req.params;
        const guild = await getGuild(guildId);
        
        if (!guild) {
            return res.status(404).json({ error: 'Guild not found' });
        }
        
        res.json(guild);
    } catch (error) {
        console.error('Error fetching guild:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 모든 길드 조회
router.get('/', async (req, res) => {
    try {
        const guilds = await getGuilds();
        res.json(guilds);
    } catch (error) {
        console.error('Error fetching guilds:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;