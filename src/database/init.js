import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DATABASE_URL?.split(':')[0],
    database: process.env.DATABASE_NAME,
    password: process.env.DB_PW,
    port: parseInt(process.env.DATABASE_URL?.split(':')[1] || '5432'),
});

export async function initDatabase() {
    try {
        // Guilds table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS guilds (
                id SERIAL PRIMARY KEY,
                guild_id VARCHAR(20) UNIQUE NOT NULL,
                guild_name VARCHAR(255) NOT NULL,
                owner_id VARCHAR(20) NOT NULL,
                settings JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Events table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                guild_id VARCHAR(20) NOT NULL,
                event_name VARCHAR(255) NOT NULL,
                description TEXT,
                score_type VARCHAR(20) DEFAULT 'points',
                sort_direction VARCHAR(4) DEFAULT 'desc',
                score_aggregation VARCHAR(10) DEFAULT 'sum',
                is_active BOOLEAN DEFAULT true,
                created_by VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
            )
        `);

        // Participants table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS participants (
                id SERIAL PRIMARY KEY,
                event_id INTEGER NOT NULL,
                user_id VARCHAR(20) NOT NULL,
                username VARCHAR(255) NOT NULL,
                discriminator VARCHAR(10),
                avatar_url TEXT,
                total_score DECIMAL(10,2) DEFAULT 0,
                entries_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(event_id, user_id),
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
            )
        `);

        // Score entries table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS score_entries (
                id SERIAL PRIMARY KEY,
                participant_id INTEGER NOT NULL,
                score DECIMAL(10,2) NOT NULL,
                note TEXT,
                added_by VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
            )
        `);

        // Guild members table (cached Discord members)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS guild_members (
                id SERIAL PRIMARY KEY,
                guild_id VARCHAR(20) NOT NULL,
                user_id VARCHAR(20) NOT NULL,
                username VARCHAR(255) NOT NULL,
                display_name VARCHAR(255) NOT NULL,
                discriminator VARCHAR(10),
                avatar_url TEXT,
                is_bot BOOLEAN DEFAULT false,
                joined_at TIMESTAMP,
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(guild_id, user_id),
                FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
            )
        `);

        // Add sort_direction column if it doesn't exist (for existing databases)
        try {
            await pool.query(`
                ALTER TABLE events 
                ADD COLUMN IF NOT EXISTS sort_direction VARCHAR(4) DEFAULT 'desc'
            `);
        } catch (error) {
            // Ignore error if column already exists
            console.log('sort_direction column already exists or error adding it:', error.message);
        }

        // Add score_aggregation column if it doesn't exist (for existing databases)
        try {
            await pool.query(`
                ALTER TABLE events 
                ADD COLUMN IF NOT EXISTS score_aggregation VARCHAR(10) DEFAULT 'sum'
            `);
        } catch (error) {
            // Ignore error if column already exists
            console.log('score_aggregation column already exists or error adding it:', error.message);
        }

        // Create indexes
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_events_guild_id ON events(guild_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_participants_event_id ON participants(event_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_score_entries_participant_id ON score_entries(participant_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_guild_members_guild_id ON guild_members(guild_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_guild_members_search ON guild_members(guild_id, display_name, username)`);

        console.log('✅ PostgreSQL database initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        throw error;
    }
}

export { pool as db };