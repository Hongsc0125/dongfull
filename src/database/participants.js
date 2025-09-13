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
        // 한 번의 쿼리로 이벤트 정보와 리더보드를 함께 조회
        const result = await db.query(`
            WITH event_info AS (
                SELECT score_aggregation, sort_direction, guild_id
                FROM events 
                WHERE id = $1
            ),
            participant_scores AS (
                SELECT 
                    p.*,
                    p.entries_count as entry_count,
                    COALESCE(gm.display_name, p.username) as display_name,
                    CASE ei.score_aggregation
                        WHEN 'sum' THEN p.total_score
                        WHEN 'average' THEN 
                            CASE WHEN p.entries_count > 0 THEN p.total_score / p.entries_count ELSE 0 END
                        WHEN 'best' THEN 
                            CASE ei.sort_direction 
                                WHEN 'desc' THEN COALESCE((SELECT MAX(score) FROM score_entries se WHERE se.participant_id = p.id), 0)
                                ELSE COALESCE((SELECT MIN(score) FROM score_entries se WHERE se.participant_id = p.id), 0)
                            END
                        ELSE p.total_score
                    END as calculated_score,
                    ei.sort_direction
                FROM participants p
                CROSS JOIN event_info ei
                LEFT JOIN guild_members gm ON p.user_id = gm.user_id AND gm.guild_id = ei.guild_id
                WHERE p.event_id = $1
            )
            SELECT 
                *,
                ROW_NUMBER() OVER (
                    ORDER BY 
                        CASE WHEN sort_direction = 'desc' THEN calculated_score END DESC,
                        CASE WHEN sort_direction = 'asc' THEN calculated_score END ASC,
                        display_name ASC
                ) as rank
            FROM participant_scores
            ORDER BY 
                CASE WHEN sort_direction = 'desc' THEN calculated_score END DESC,
                CASE WHEN sort_direction = 'asc' THEN calculated_score END ASC,
                display_name ASC
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

export async function updateScoreEntry(entryId, newScore, note = null) {
    try {
        await db.query('BEGIN');

        // Get the old score and participant info
        const oldEntryResult = await db.query(`
            SELECT se.*, p.id as participant_id, e.score_aggregation
            FROM score_entries se
            JOIN participants p ON se.participant_id = p.id
            JOIN events e ON p.event_id = e.id
            WHERE se.id = $1
        `, [entryId]);

        if (oldEntryResult.rows.length === 0) {
            throw new Error('Score entry not found');
        }

        const oldEntry = oldEntryResult.rows[0];
        const scoreDifference = newScore - oldEntry.score;

        // Update the score entry
        await db.query(`
            UPDATE score_entries 
            SET score = $2, note = $3, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [entryId, newScore, note]);

        // Update participant total_score only for sum/average aggregation
        if (oldEntry.score_aggregation === 'sum' || oldEntry.score_aggregation === 'average') {
            await db.query(`
                UPDATE participants 
                SET total_score = total_score + $2,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [oldEntry.participant_id, scoreDifference]);
        }

        await db.query('COMMIT');

        // Return updated entry
        const result = await db.query(`
            SELECT * FROM score_entries WHERE id = $1
        `, [entryId]);

        return result.rows[0];
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error updating score entry:', error);
        throw error;
    }
}

export async function deleteScoreEntry(entryId) {
    try {
        await db.query('BEGIN');

        // Get the entry info before deletion
        const entryResult = await db.query(`
            SELECT se.*, p.id as participant_id, e.score_aggregation
            FROM score_entries se
            JOIN participants p ON se.participant_id = p.id
            JOIN events e ON p.event_id = e.id
            WHERE se.id = $1
        `, [entryId]);

        if (entryResult.rows.length === 0) {
            throw new Error('Score entry not found');
        }

        const entry = entryResult.rows[0];

        // Delete the score entry
        await db.query(`
            DELETE FROM score_entries WHERE id = $1
        `, [entryId]);

        // Update participant stats
        // For sum/average: subtract the score from total_score
        if (entry.score_aggregation === 'sum' || entry.score_aggregation === 'average') {
            await db.query(`
                UPDATE participants 
                SET total_score = total_score - $2,
                    entries_count = entries_count - 1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [entry.participant_id, entry.score]);
        } else {
            // For best: just decrease entries_count
            await db.query(`
                UPDATE participants 
                SET entries_count = entries_count - 1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [entry.participant_id]);
        }

        await db.query('COMMIT');

        return entry;
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error deleting score entry:', error);
        throw error;
    }
}

export async function getScoreEntry(entryId) {
    try {
        const result = await db.query(`
            SELECT se.*, p.username, p.user_id, e.event_name
            FROM score_entries se
            JOIN participants p ON se.participant_id = p.id
            JOIN events e ON p.event_id = e.id
            WHERE se.id = $1
        `, [entryId]);

        return result.rows[0];
    } catch (error) {
        console.error('Error getting score entry:', error);
        throw error;
    }
}