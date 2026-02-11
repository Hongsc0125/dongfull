import { Client, GatewayIntentBits, Events } from 'discord.js';
import dotenv from 'dotenv';
import { initDatabase } from '../database/init.js';
import { registerGuild } from '../database/guilds.js';
import { setClient, syncSpecificGuild } from '../scheduler/index.js';
import { upsertGuildMember, removeGuildMember, syncGuildMembers } from '../database/guild-members.js';
import { handleCreateEvent, handleCreateEventModal } from './commands/create-event.js';
import { handleAddScore, handleUserSelect, handleScoreInputButton, handleScoreModal, handleUserSearchModal, handleUserSearchResult } from './commands/add-score.js';
import { handleRanking } from './commands/leaderboard.js';
import { handleEventList } from './commands/event-list.js';
import { handleEventInfo } from './commands/event-info.js';
import { handleToggleEvent } from './commands/toggle-event.js';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers // 멤버 이벤트를 위해 추가
    ]
});

client.once(Events.ClientReady, async (readyClient) => {
    console.log(`✅ Event Ranking Bot is ready! Logged in as ${readyClient.user.tag}`);
    console.log(`📊 Connected to ${readyClient.guilds.cache.size} servers`);
    await initDatabase();
    
    // 스케줄러 시작
    setClient(readyClient);
    console.log(`📅 Scheduler initialized for member sync`);
    
    // 모든 길드의 멤버 즉시 동기화 (시작 시)
    console.log(`🚀 Starting initial member sync for all guilds...`);
    let totalSynced = 0;
    let successCount = 0;
    let errorCount = 0;
    
    for (const [guildId, guild] of readyClient.guilds.cache) {
        try {
            console.log(`🔄 Syncing members for: ${guild.name} (${guild.memberCount || 'Unknown'} members)`);
            const memberCount = await syncGuildMembers(guild);
            totalSynced += memberCount;
            successCount++;
            console.log(`✅ ${guild.name}: ${memberCount} members synced`);
            
            // 각 길드 사이에 2초 대기 (API 레이트 리미트 방지)
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error(`❌ Failed to sync ${guild.name}:`, error.message);
            errorCount++;
        }
    }
    
    console.log(`🎉 Initial sync completed:
    - Total guilds: ${readyClient.guilds.cache.size}
    - Successful: ${successCount}
    - Failed: ${errorCount}
    - Total members synced: ${totalSynced}
    
📋 Bot is now fully ready with member database populated!`);
});

client.on(Events.GuildCreate, async (guild) => {
    console.log(`➕ Joined new server: ${guild.name} (${guild.id}) - ${guild.memberCount || 'Unknown'} members`);
    
    try {
        // 길드 등록
        await registerGuild(guild.id, guild.name, guild.ownerId);
        console.log(`📝 Guild registered: ${guild.name}`);
        
        // 새 길드의 멤버 즉시 동기화
        console.log(`🔄 Starting immediate member sync for new guild: ${guild.name}`);
        const memberCount = await syncGuildMembers(guild);
        console.log(`✅ New guild sync completed: ${memberCount} members synced for ${guild.name}`);
        
    } catch (error) {
        console.error(`❌ Error setting up new guild ${guild.name}:`, error);
    }
});

// 새 멤버 가입 시
client.on(Events.GuildMemberAdd, async (member) => {
    try {
        await upsertGuildMember(member.guild.id, member);
        console.log(`👋 New member added to DB: ${member.displayName} in ${member.guild.name}`);
    } catch (error) {
        console.error('Error adding new member to DB:', error);
    }
});

// 멤버 탈퇴 시
client.on(Events.GuildMemberRemove, async (member) => {
    try {
        await removeGuildMember(member.guild.id, member.user.id);
        console.log(`👋 Member removed from DB: ${member.displayName} from ${member.guild.name}`);
    } catch (error) {
        console.error('Error removing member from DB:', error);
    }
});

// 멤버 정보 업데이트 시 (닉네임 변경 등)
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    try {
        // 변경사항이 있을 때만 업데이트
        if (oldMember.displayName !== newMember.displayName || 
            oldMember.user.username !== newMember.user.username ||
            oldMember.user.discriminator !== newMember.user.discriminator) {
            
            await upsertGuildMember(newMember.guild.id, newMember);
            console.log(`📝 Member updated in DB: ${newMember.displayName} in ${newMember.guild.name}`);
        }
    } catch (error) {
        console.error('Error updating member in DB:', error);
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        try {
            switch (commandName) {
                case '이벤트생성':
                    await handleCreateEvent(interaction);
                    break;
                case '점수추가':
                    await handleAddScore(interaction);
                    break;
                case '순위':
                    await handleRanking(interaction);
                    break;
                case '이벤트목록':
                    await handleEventList(interaction);
                    break;
                case '이벤트정보':
                    await handleEventInfo(interaction);
                    break;
                case '이벤트토글':
                    await handleToggleEvent(interaction);
                    break;
                default:
                    await interaction.reply({ 
                        content: '알 수 없는 명령어입니다.', 
                        flags: 64 // MessageFlags.Ephemeral
                    });
            }
        } catch (error) {
            console.error(`Error handling command ${commandName}:`, error);
            
            const errorMessage = '명령어 실행 중 오류가 발생했습니다.';
            
            if (!interaction.replied) {
                await interaction.reply({ content: errorMessage, flags: 64 });
            } else {
                await interaction.followUp({ content: errorMessage, flags: 64 });
            }
        }
    } else if (interaction.isModalSubmit()) {
        try {
            if (interaction.customId === 'create-event-modal') {
                await handleCreateEventModal(interaction);
            } else if (interaction.customId.startsWith('score-modal-')) {
                await handleScoreModal(interaction);
            } else if (interaction.customId.startsWith('user-search-modal-')) {
                await handleUserSearchModal(interaction);
            }
        } catch (error) {
            console.error('Error handling modal submit:', error);
            
            try {
                const errorMessage = '❌ 모달 처리 중 오류가 발생했습니다.';
                
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ 
                        content: errorMessage, 
                        flags: MessageFlags.Ephemeral 
                    });
                } else {
                    console.warn('Cannot reply to modal interaction - already handled');
                }
            } catch (replyError) {
                console.error('Error replying to modal interaction:', replyError);
                // 응답할 수 없는 경우 무시
            }
        }
    } else if (interaction.isAutocomplete()) {
        try {
            const { commandName, options } = interaction;
            const focusedOption = options.getFocused(true);
            
            if (focusedOption.name === '이벤트') {
                // 이벤트토글 명령어는 모든 이벤트(활성/비활성)를 표시
                if (commandName === '이벤트토글') {
                    const { getEvents } = await import('../database/events.js');
                    const events = await getEvents(interaction.guildId);
                    
                    const filtered = events.filter(event =>
                        event.event_name.toLowerCase().includes(focusedOption.value.toLowerCase())
                    ).slice(0, 25);
                    
                    await interaction.respond(
                        filtered.map(event => ({
                            name: `${event.event_name} (${event.score_type}) ${event.is_active ? '✅' : '❌'}`,
                            value: event.id.toString()
                        }))
                    );
                } else {
                    // 다른 명령어들은 활성 이벤트만 표시
                    const { getActiveEvents } = await import('../database/events.js');
                    const events = await getActiveEvents(interaction.guildId);
                    
                    const filtered = events.filter(event =>
                        event.event_name.toLowerCase().includes(focusedOption.value.toLowerCase())
                    ).slice(0, 25);
                    
                    await interaction.respond(
                        filtered.map(event => ({
                            name: `${event.event_name} (${event.score_type})`,
                            value: event.id.toString()
                        }))
                    );
                }
            }
        } catch (error) {
            console.error('Error handling autocomplete:', error);
        }
    } else if (interaction.isStringSelectMenu()) {
        try {
            if (interaction.customId.startsWith('user-select-')) {
                await handleUserSelect(interaction);
            } else if (interaction.customId.startsWith('user-search-result-')) {
                await handleUserSearchResult(interaction);
            }
        } catch (error) {
            console.error('Error handling select menu:', error);
            
            const errorMessage = '선택 메뉴 처리 중 오류가 발생했습니다.';
            
            if (!interaction.replied) {
                await interaction.reply({ content: errorMessage, flags: 64 });
            }
        }
    } else if (interaction.isButton()) {
        try {
            if (interaction.customId.startsWith('score-input-')) {
                await handleScoreInputButton(interaction);
            }
        } catch (error) {
            console.error('Error handling button:', error);
            
            const errorMessage = '버튼 처리 중 오류가 발생했습니다.';
            
            if (!interaction.replied) {
                await interaction.reply({ content: errorMessage, flags: 64 });
            }
        }
    }
});

export { client };

if (process.env.NODE_ENV !== 'test') {
    client.login(process.env.DISCORD_TOKEN);
}