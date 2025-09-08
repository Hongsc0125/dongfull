import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initDatabase } from '../database/init.js';
import { getEvents, getEventById } from '../database/events.js';
import { getLeaderboard } from '../database/participants.js';
import { client } from '../bot/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

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
        console.error('Error fetching events:', error);
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
        console.error('Error fetching event:', error);
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
        console.error('Error fetching leaderboard:', error);
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

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

async function startServer() {
    try {
        await initDatabase();
        
        app.listen(PORT, () => {
            console.log(`🚀 API Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

if (process.env.NODE_ENV !== 'test') {
    startServer();
}

export { app };