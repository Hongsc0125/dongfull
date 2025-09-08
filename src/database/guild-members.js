import { db } from './init.js';

// 길드 멤버를 DB에 추가/업데이트
export async function upsertGuildMember(guildId, member) {
    try {
        const result = await db.query(`
            INSERT INTO guild_members (
                guild_id, user_id, username, display_name, discriminator, 
                avatar_url, is_bot, joined_at, last_seen, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (guild_id, user_id) 
            DO UPDATE SET 
                username = EXCLUDED.username,
                display_name = EXCLUDED.display_name,
                discriminator = EXCLUDED.discriminator,
                avatar_url = EXCLUDED.avatar_url,
                last_seen = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [
            guildId,
            member.user.id,
            member.user.username,
            member.displayName,
            member.user.discriminator,
            member.user.displayAvatarURL(),
            member.user.bot,
            member.joinedAt
        ]);

        return result.rows[0];
    } catch (error) {
        console.error('Error upserting guild member:', error);
        throw error;
    }
}

// 길드의 모든 멤버를 DB와 동기화
export async function syncGuildMembers(guild) {
    try {
        console.log(`🔄 Syncing members for guild: ${guild.name} (${guild.id})`);
        
        let totalMembers = 0;
        let batchCount = 0;
        const batchSize = 100;
        
        // 배치로 멤버 가져오기 (타임아웃 방지)
        const members = await guild.members.fetch({ limit: 1000, time: 30000 });
        
        // 배치 단위로 처리
        const memberArray = Array.from(members.values());
        for (let i = 0; i < memberArray.length; i += batchSize) {
            const batch = memberArray.slice(i, i + batchSize);
            
            // 트랜잭션으로 배치 처리
            await db.query('BEGIN');
            
            try {
                for (const member of batch) {
                    await upsertGuildMember(guild.id, member);
                    totalMembers++;
                }
                
                await db.query('COMMIT');
                batchCount++;
                console.log(`   ✅ Batch ${batchCount} completed: ${batch.length} members`);
            } catch (error) {
                await db.query('ROLLBACK');
                console.error(`   ❌ Batch ${batchCount + 1} failed:`, error.message);
            }
        }
        
        // 마지막으로 본 시간이 24시간 이상 된 멤버들을 비활성화
        await db.query(`
            UPDATE guild_members 
            SET last_seen = last_seen 
            WHERE guild_id = $1 
            AND last_seen < NOW() - INTERVAL '24 hours'
        `, [guild.id]);
        
        console.log(`✅ Guild sync completed: ${totalMembers} members synced for ${guild.name}`);
        
        return totalMembers;
    } catch (error) {
        console.error('Error syncing guild members:', error);
        
        // 타임아웃이나 큰 길드의 경우 캐시된 멤버만 동기화
        if (error.message.includes('time') || error.code === 'GuildMembersTimeout') {
            console.log(`⚠️ Falling back to cached members for large guild: ${guild.name}`);
            
            const cachedMembers = guild.members.cache;
            let syncedCount = 0;
            
            for (const member of cachedMembers.values()) {
                try {
                    await upsertGuildMember(guild.id, member);
                    syncedCount++;
                } catch (err) {
                    console.error('Error syncing cached member:', err.message);
                }
            }
            
            console.log(`✅ Cached sync completed: ${syncedCount} members for ${guild.name}`);
            return syncedCount;
        }
        
        throw error;
    }
}

// DB에서 길드 멤버 검색
export async function searchGuildMembers(guildId, searchQuery, limit = 25) {
    try {
        const result = await db.query(`
            SELECT * FROM guild_members 
            WHERE guild_id = $1 
            AND is_bot = false
            AND (
                LOWER(display_name) LIKE LOWER($2) 
                OR LOWER(username) LIKE LOWER($2)
            )
            ORDER BY last_seen DESC, display_name ASC
            LIMIT $3
        `, [guildId, `%${searchQuery}%`, limit]);

        return result.rows;
    } catch (error) {
        console.error('Error searching guild members:', error);
        throw error;
    }
}

// DB에서 길드의 모든 멤버 가져오기 (최근 활동 순)
export async function getGuildMembers(guildId, limit = 25) {
    try {
        const result = await db.query(`
            SELECT * FROM guild_members 
            WHERE guild_id = $1 
            AND is_bot = false
            ORDER BY last_seen DESC, display_name ASC
            LIMIT $2
        `, [guildId, limit]);

        return result.rows;
    } catch (error) {
        console.error('Error getting guild members:', error);
        throw error;
    }
}

// 특정 멤버 가져오기
export async function getGuildMember(guildId, userId) {
    try {
        const result = await db.query(`
            SELECT * FROM guild_members 
            WHERE guild_id = $1 AND user_id = $2
        `, [guildId, userId]);

        return result.rows[0];
    } catch (error) {
        console.error('Error getting guild member:', error);
        throw error;
    }
}

// 멤버 삭제 (서버 탈퇴 시)
export async function removeGuildMember(guildId, userId) {
    try {
        const result = await db.query(`
            DELETE FROM guild_members 
            WHERE guild_id = $1 AND user_id = $2
            RETURNING *
        `, [guildId, userId]);

        return result.rows[0];
    } catch (error) {
        console.error('Error removing guild member:', error);
        throw error;
    }
}

// 길드 멤버 통계
export async function getGuildMemberStats(guildId) {
    try {
        const result = await db.query(`
            SELECT 
                COUNT(*) as total_members,
                COUNT(*) FILTER (WHERE is_bot = false) as human_members,
                COUNT(*) FILTER (WHERE is_bot = true) as bot_members,
                COUNT(*) FILTER (WHERE last_seen > NOW() - INTERVAL '7 days') as recent_members
            FROM guild_members 
            WHERE guild_id = $1
        `, [guildId]);

        return result.rows[0];
    } catch (error) {
        console.error('Error getting guild member stats:', error);
        throw error;
    }
}