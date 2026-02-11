import { db } from './init.js';

export async function registerGuild(guildId, guildName, ownerId) {
    try {
        const result = await db.query(`
            INSERT INTO guilds (guild_id, guild_name, owner_id)
            VALUES ($1, $2, $3)
            ON CONFLICT (guild_id) 
            DO UPDATE SET 
                guild_name = EXCLUDED.guild_name,
                owner_id = EXCLUDED.owner_id,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [guildId, guildName, ownerId]);

        return result.rows[0];
    } catch (error) {
        console.error('Error registering guild:', error);
        throw error;
    }
}

export async function getGuild(guildId) {
    try {
        const result = await db.query(`
            SELECT * FROM guilds 
            WHERE guild_id = $1
        `, [guildId]);

        return result.rows[0];
    } catch (error) {
        console.error('Error getting guild:', error);
        throw error;
    }
}

export async function updateGuildSettings(guildId, settings) {
    try {
        const result = await db.query(`
            UPDATE guilds 
            SET 
                settings = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE guild_id = $1
            RETURNING *
        `, [guildId, JSON.stringify(settings)]);

        return result.rows[0];
    } catch (error) {
        console.error('Error updating guild settings:', error);
        throw error;
    }
}

export async function getGuilds() {
    try {
        const result = await db.query(`
            SELECT * FROM guilds 
            ORDER BY guild_name ASC
        `);

        return result.rows;
    } catch (error) {
        console.error('Error getting guilds:', error);
        throw error;
    }
}

export async function addGuild(guildId, guildName, ownerId) {
    return await registerGuild(guildId, guildName, ownerId);
}

export async function isServerOwnerOrAdmin(guildId, userId, member) {
    try {
        const guild = await getGuild(guildId);
        
        // Check if user is server owner
        if (guild && guild.owner_id === userId) {
            return true;
        }

        // Check if user has administrator permissions
        if (member && member.permissions.has('Administrator')) {
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error checking admin permissions:', error);
        return false;
    }
}