import cron from 'node-cron';
import { syncGuildMembers } from '../database/guild-members.js';

let client = null;

// 봇 클라이언트 설정
export function setClient(discordClient) {
    client = discordClient;
    startScheduler();
}

function startScheduler() {
    if (!client) {
        console.error('❌ Discord client not set for scheduler');
        return;
    }

    console.log('📅 Starting guild member sync scheduler');

    // 매일 오전 3시에 길드 멤버 동기화
    cron.schedule('0 3 * * *', async () => {
        console.log('🕒 Starting daily guild member sync...');
        await syncAllGuilds();
    });

    // 6시간마다 길드 멤버 동기화 (선택사항)
    cron.schedule('0 */6 * * *', async () => {
        console.log('🕕 Starting 6-hour guild member sync...');
        await syncAllGuilds();
    });

    console.log('✅ Scheduler is running:');
    console.log('  📅 Daily sync: 03:00 AM');
    console.log('  🕕 Interval sync: Every 6 hours');
    console.log('  🚀 Initial sync: Handled by bot startup');
}

async function syncAllGuilds() {
    if (!client || !client.guilds) {
        console.error('❌ Client or guilds not available');
        return;
    }

    const guilds = client.guilds.cache;
    let totalSynced = 0;
    let successCount = 0;
    let errorCount = 0;

    console.log(`🔄 Syncing ${guilds.size} guilds...`);

    for (const [guildId, guild] of guilds) {
        try {
            const memberCount = await syncGuildMembers(guild);
            totalSynced += memberCount;
            successCount++;
            
            // 각 길드 사이에 1초 대기 (API 레이트 리미트 방지)
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`❌ Failed to sync guild ${guild.name}:`, error.message);
            errorCount++;
        }
    }

    console.log(`✅ Guild sync completed:
    - Guilds processed: ${guilds.size}
    - Successful: ${successCount}
    - Failed: ${errorCount}
    - Total members synced: ${totalSynced}`);
}

// 특정 길드만 수동 동기화
export async function syncSpecificGuild(guildId) {
    if (!client) {
        throw new Error('Discord client not available');
    }

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
        throw new Error('Guild not found');
    }

    console.log(`🔄 Manual sync for guild: ${guild.name}`);
    const memberCount = await syncGuildMembers(guild);
    console.log(`✅ Manual sync completed: ${memberCount} members`);
    
    return memberCount;
}

// 스케줄러 정보 가져오기
export function getSchedulerStatus() {
    return {
        isRunning: client !== null,
        nextDailySync: '03:00 AM daily',
        nextIntervalSync: 'Every 6 hours',
        totalScheduledTasks: 2
    };
}