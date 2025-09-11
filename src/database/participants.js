import { db } from './init.js';

export async function addParticipant(eventId, userId, username, discriminator, avatarUrl) {
    try {
        const result = await db.query(`
            INSERT INTO participants (event_id, user_id, username, discriminator, avatar_url)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (event_id, user_id) 
            DO UPDATE SET 
                username = EXCLUDED.username,
                discriminator = EXCLUDED.discriminator,
                avatar_url = EXCLUDED.avatar_url,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [eventId, userId, username, discriminator, avatarUrl]);

        return result.rows[0];
    } catch (error) {
        console.error('Error adding participant:', error);
        throw error;
    }
}

export async function getParticipants(eventId) {
    try {
        const result = await db.query(`
            SELECT 
                p.*,
                COALESCE(gm.display_name, p.username) as display_name
            FROM participants p
            LEFT JOIN guild_members gm ON p.user_id = gm.user_id AND gm.guild_id = (
                SELECT guild_id FROM events WHERE id = $1
            )
            WHERE p.event_id = $1
            ORDER BY p.total_score DESC, COALESCE(gm.display_name, p.username) ASC
        `, [eventId]);

        return result.rows;
    } catch (error) {
        console.error('Error getting participants:', error);
        throw error;
    }
}

export async function getParticipant(eventId, userId) {
    try {
        // 참가자 정보와 기록 내역을 함께 조회
        const participantResult = await db.query(`
            SELECT 
                p.*,
                p.entries_count as entry_count,
                COALESCE(gm.display_name, p.username) as display_name
            FROM participants p
            LEFT JOIN guild_members gm ON p.user_id = gm.user_id AND gm.guild_id = (
                SELECT guild_id FROM events WHERE id = $1
            )
            WHERE p.event_id = $1 AND p.user_id = $2
        `, [eventId, userId]);

        if (participantResult.rows.length === 0) {
            return null;
        }

        const participant = participantResult.rows[0];

        // 해당 참가자의 모든 기록 조회
        const entriesResult = await db.query(`
            SELECT 
                id,
                score,
                note,
                added_by,
                created_at
            FROM score_entries 
            WHERE participant_id = $1
            ORDER BY created_at DESC
        `, [participant.id]);

        participant.entries = entriesResult.rows;

        return participant;
    } catch (error) {
        console.error('Error getting participant:', error);
        throw error;
    }
}

export async function updateParticipantScore(participantId, scoreChange, addedBy, note = null) {
    try {
        // Start transaction
        await db.query('BEGIN');

        // Add score entry
        await db.query(`
            INSERT INTO score_entries (participant_id, score, note, added_by)
            VALUES ($1, $2, $3, $4)
        `, [participantId, scoreChange, note, addedBy]);

        // Get event aggregation method to determine if we should update total_score
        const eventResult = await db.query(`
            SELECT e.score_aggregation
            FROM events e
            JOIN participants p ON e.id = p.event_id
            WHERE p.id = $1
        `, [participantId]);
        
        const aggregation = eventResult.rows[0]?.score_aggregation || 'sum';

        // Update participant based on aggregation method
        let result;
        if (aggregation === 'best') {
            // For 'best' method, don't update total_score, only increment entries_count
            result = await db.query(`
                UPDATE participants 
                SET 
                    entries_count = entries_count + 1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *
            `, [participantId]);
        } else {
            // For 'sum' and 'average' methods, update total_score
            result = await db.query(`
                UPDATE participants 
                SET 
                    total_score = total_score + $2,
                    entries_count = entries_count + 1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *
            `, [participantId, scoreChange]);
        }

        await db.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error updating participant score:', error);
        throw error;
    }
}

export async function getLeaderboard(eventId, limit = 999) {
    try {
        // 이벤트 정보를 가져와서 집계 방식과 정렬 방향 확인
        const eventResult = await db.query(`
            SELECT score_aggregation, sort_direction 
            FROM events 
            WHERE id = $1
        `, [eventId]);
        
        if (eventResult.rows.length === 0) {
            throw new Error('Event not found');
        }
        
        const { score_aggregation, sort_direction } = eventResult.rows[0];
        
        let scoreQuery = '';
        
        // 집계 방식에 따라 쿼리 변경
        switch (score_aggregation) {
            case 'sum':
                scoreQuery = 'p.total_score as calculated_score';
                break;
            case 'average':
                scoreQuery = `
                    CASE 
                        WHEN p.entries_count > 0 THEN p.total_score / p.entries_count 
                        ELSE 0 
                    END as calculated_score
                `;
                break;
            case 'best':
                scoreQuery = `
                    COALESCE((
                        SELECT ${sort_direction === 'desc' ? 'MAX(score)' : 'MIN(score)'} 
                        FROM score_entries se 
                        WHERE se.participant_id = p.id
                    ), 0) as calculated_score
                `;
                break;
            default:
                scoreQuery = 'p.total_score as calculated_score';
        }
        
        
        const result = await db.query(`
            SELECT 
                *,
                ROW_NUMBER() OVER (ORDER BY calculated_score ${sort_direction === 'desc' ? 'DESC' : 'ASC'}, display_name ASC) as rank
            FROM (
                SELECT 
                    p.*,
                    p.entries_count as entry_count,
                    COALESCE(gm.display_name, p.username) as display_name,
                    ${scoreQuery}
                FROM participants p
                LEFT JOIN guild_members gm ON p.user_id = gm.user_id AND gm.guild_id = (
                    SELECT guild_id FROM events WHERE id = $1
                )
                WHERE p.event_id = $1
            ) ranked_data
            ORDER BY calculated_score ${sort_direction === 'desc' ? 'DESC' : 'ASC'}, display_name ASC
            LIMIT $2
        `, [eventId, limit]);

        return result.rows;
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        throw error;
    }
}

export async function getParticipantScoreHistory(participantId) {
    try {
        const result = await db.query(`
            SELECT se.*, p.username 
            FROM score_entries se
            JOIN participants p ON se.participant_id = p.id
            WHERE se.participant_id = $1
            ORDER BY se.created_at DESC
        `, [participantId]);

        return result.rows;
    } catch (error) {
        console.error('Error getting score history:', error);
        throw error;
    }
}