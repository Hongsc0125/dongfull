import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initDatabase } from '../database/init.js';
import { getEvents, getEventById, createEvent, updateEventStatus } from '../database/events.js';
import { getLeaderboard, addParticipant, getParticipant, updateParticipantScore } from '../database/participants.js';
import { registerGuild } from '../database/guilds.js';
import { getGuildMembers, searchGuildMembers } from '../database/guild-members.js';
import { client } from '../bot/index.js';
import { apiLogger } from '../utils/logger.js';
import logsRouter from './routes/logs.js';
import guildRouter from './routes/guild.js';
import eventDetailRouter from './routes/event-detail.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3777',
    'https://evt-board.com',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// 라우터 추가
app.use('/api/logs', logsRouter);
app.use('/api/guild', guildRouter);
app.use('/api/event-detail', eventDetailRouter);

// API 요청 로깅 미들웨어
app.use((req, res, next) => {
    const start = Date.now();
    
    apiLogger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        query: req.query,
        body: req.method !== 'GET' ? req.body : undefined
    });

    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 400 ? 'error' : 'info';
        
        apiLogger[level](`${req.method} ${req.path} ${res.statusCode}`, {
            duration: `${duration}ms`,
            status: res.statusCode,
            ip: req.ip
        });
    });

    next();
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/bot/status', (req, res) => {
    const isOnline = client.isReady();
    res.json({
        online: isOnline,
        status: isOnline ? 'online' : 'offline',
        guilds: isOnline ? client.guilds.cache.size : 0,
        users: isOnline ? client.users.cache.size : 0,
        uptime: isOnline ? process.uptime() : 0
    });
});

app.get('/api/events/:guildId', async (req, res) => {
    try {
        const { guildId } = req.params;
        const events = await getEvents(guildId);
        res.json(events);
    } catch (error) {
        apiLogger.error('Error fetching events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/event/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await getEventById(parseInt(eventId));
        
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        res.json(event);
    } catch (error) {
        apiLogger.error('Error fetching event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/leaderboard/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const limit = parseInt(req.query.limit) || 999;
        
        const leaderboard = await getLeaderboard(parseInt(eventId), limit);
        res.json(leaderboard);
    } catch (error) {
        apiLogger.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/guilds', (req, res) => {
    if (!client.isReady()) {
        return res.status(503).json({ error: 'Bot is not ready' });
    }

    const guilds = client.guilds.cache.map(guild => ({
        guild_id: guild.id,
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL(),
        memberCount: guild.memberCount
    }));

    res.json(guilds);
});

// 이벤트 생성
app.post('/api/events', async (req, res) => {
    try {
        const { 
            guildId, 
            eventName, 
            description, 
            scoreType, 
            creatorId, 
            sortDirection, 
            scoreAggregation 
        } = req.body;

        // 입력값 검증
        if (!guildId || !eventName || !creatorId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 길드가 없으면 등록 (Discord에서 길드 정보 가져오기)
        if (client.isReady()) {
            const guild = client.guilds.cache.get(guildId);
            if (guild) {
                await registerGuild(guildId, guild.name, guild.ownerId);
            }
        }

        // 이벤트 생성
        const event = await createEvent(
            guildId,
            eventName,
            description,
            scoreType || 'points',
            creatorId,
            sortDirection || 'desc',
            scoreAggregation || 'sum'
        );

        res.json(event);
    } catch (error) {
        apiLogger.error('Error creating event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 이벤트 상태 변경 (활성화/비활성화)
app.patch('/api/events/:eventId/toggle', async (req, res) => {
    try {
        const { eventId } = req.params;
        const { isActive } = req.body;

        const event = await updateEventStatus(parseInt(eventId), isActive);
        
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json(event);
    } catch (error) {
        apiLogger.error('Error updating event status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 길드 멤버 목록 조회
app.get('/api/guild/:guildId/members', async (req, res) => {
    try {
        const { guildId } = req.params;
        const { search, limit = 50 } = req.query;

        let members;
        if (search) {
            members = await searchGuildMembers(guildId, search, parseInt(limit));
        } else {
            members = await getGuildMembers(guildId, parseInt(limit));
        }

        res.json(members);
    } catch (error) {
        apiLogger.error('Error fetching guild members:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 점수 추가
app.post('/api/participants/:participantId/score', async (req, res) => {
    try {
        const { participantId } = req.params;
        const { score, addedBy, note } = req.body;

        if (score === undefined || !addedBy) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const participant = await updateParticipantScore(
            parseInt(participantId),
            parseFloat(score),
            addedBy,
            note
        );

        res.json(participant);
    } catch (error) {
        apiLogger.error('Error adding score:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 참가자 추가 또는 조회
app.post('/api/participants', async (req, res) => {
    try {
        const { eventId, userId, username, discriminator, avatarUrl } = req.body;

        if (!eventId || !userId || !username) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const participant = await addParticipant(
            parseInt(eventId),
            userId,
            username,
            discriminator || '0',
            avatarUrl
        );

        res.json(participant);
    } catch (error) {
        apiLogger.error('Error adding participant:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 특정 참가자 조회
app.get('/api/events/:eventId/participants/:userId', async (req, res) => {
    try {
        const { eventId, userId } = req.params;

        const participant = await getParticipant(parseInt(eventId), userId);
        
        if (!participant) {
            return res.status(404).json({ error: 'Participant not found' });
        }

        res.json(participant);
    } catch (error) {
        apiLogger.error('Error fetching participant:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 참가자 기록 히스토리 조회
app.get('/api/participants/history', async (req, res) => {
    try {
        const { eventId, userId } = req.query;

        if (!eventId || !userId) {
            return res.status(400).json({ error: 'eventId and userId are required' });
        }

        const participant = await getParticipant(parseInt(eventId), userId);
        
        if (!participant) {
            return res.status(404).json({ error: 'Participant not found' });
        }

        // 참가자의 모든 기록을 반환 (entries 배열에 포함되어 있음)
        res.json({
            participant,
            entries: participant.entries || []
        });
    } catch (error) {
        apiLogger.error('Error fetching participant history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.use((err, req, res, next) => {
    apiLogger.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

async function startServer() {
    try {
        await initDatabase();
        
        app.listen(PORT, () => {
            apiLogger.info(`🚀 API Server running on port ${PORT}`);
        });
    } catch (error) {
        apiLogger.error('Failed to start server:', error);
        process.exit(1);
    }
}

if (process.env.NODE_ENV !== 'test') {
    startServer();
}

export { app };