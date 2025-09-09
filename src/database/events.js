import { db } from './init.js';

export async function createEvent(guildId, eventName, description, scoreType, createdBy, sortDirection = null, scoreAggregation = 'sum') {
    try {
        // Auto-determine sort direction if not provided
        if (!sortDirection) {
            sortDirection = scoreType.startsWith('time_') ? 'asc' : 'desc';
        }
        
        const result = await db.query(`
            INSERT INTO events (guild_id, event_name, description, score_type, sort_direction, score_aggregation, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [guildId, eventName, description, scoreType, sortDirection, scoreAggregation, createdBy]);

        return result.rows[0];
    } catch (error) {
        console.error('Error creating event:', error);
        throw error;
    }
}

export async function getEvents(guildId) {
    try {
        const result = await db.query(`
            SELECT * FROM events 
            WHERE guild_id = $1 
            ORDER BY created_at DESC
        `, [guildId]);

        return result.rows;
    } catch (error) {
        console.error('Error getting events:', error);
        throw error;
    }
}

export async function getActiveEvents(guildId) {
    try {
        const result = await db.query(`
            SELECT * FROM events 
            WHERE guild_id = $1 AND is_active = true
            ORDER BY created_at DESC
        `, [guildId]);

        return result.rows;
    } catch (error) {
        console.error('Error getting active events:', error);
        throw error;
    }
}

export async function getEventById(eventId) {
    try {
        const result = await db.query(`
            SELECT * FROM events 
            WHERE id = $1
        `, [eventId]);

        return result.rows[0];
    } catch (error) {
        console.error('Error getting event by ID:', error);
        throw error;
    }
}

export async function updateEvent(eventId, updates) {
    try {
        const setClause = Object.keys(updates)
            .map((key, index) => `${key} = $${index + 2}`)
            .join(', ');
        
        const values = [eventId, ...Object.values(updates)];
        
        const result = await db.query(`
            UPDATE events 
            SET ${setClause}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, values);

        return result.rows[0];
    } catch (error) {
        console.error('Error updating event:', error);
        throw error;
    }
}

export async function updateEventStatus(eventId, isActive) {
    try {
        const result = await db.query(`
            UPDATE events 
            SET is_active = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [eventId, isActive]);

        return result.rows[0];
    } catch (error) {
        console.error('Error updating event status:', error);
        throw error;
    }
}

export async function deleteEvent(eventId) {
    try {
        const result = await db.query(`
            DELETE FROM events 
            WHERE id = $1
            RETURNING *
        `, [eventId]);

        return result.rows[0];
    } catch (error) {
        console.error('Error deleting event:', error);
        throw error;
    }
}