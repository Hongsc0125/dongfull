import {
    ContainerBuilder,
    SectionBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags,
    ThumbnailBuilder
} from 'discord.js';
import { getEventById } from '../../database/events.js';
import { getParticipants } from '../../database/participants.js';

export async function handleEventInfo(interaction) {
    const eventId = parseInt(interaction.options.getString('이벤트'));

    try {
        const event = await getEventById(eventId);
        if (!event || event.guild_id !== interaction.guildId) {
            return await interaction.reply({
                content: '❌ 존재하지 않는 이벤트이거나 다른 서버의 이벤트입니다.',
                flags: MessageFlags.Ephemeral
            });
        }

        const participants = await getParticipants(event.id);

        // Build content in maximum 3 parts to stay within component limit
        const headerContent = `## 📊 ${event.event_name} - 상세 정보\n\n` +
                             `### 🆔 이벤트 ID: ${event.id}\n` +
                             `### 📊 점수 타입: ${getScoreTypeDisplay(event.score_type)}\n` +
                             `### 🔘 상태: ${event.is_active ? '✅ 활성' : '❌ 비활성'}\n` +
                             `### 👥 참가자 수: ${participants.length}명\n` +
                             `### 📅 생성일: <t:${Math.floor(new Date(event.created_at).getTime() / 1000)}:F>`;

        let participantContent = '';
        let statsContent = '';

        if (event.description) {
            participantContent += `### 📄 설명: ${event.description}\n\n`;
        }

        // Show top 5 participants
        if (participants.length > 0) {
            const topParticipants = participants.slice(0, 5);
            const participantText = topParticipants.map((participant, index) => {
                const rankEmoji = getRankEmoji(index + 1);
                const score = formatScore(participant.total_score, event.score_type);
                return `${rankEmoji} ${participant.display_name} - ${score}`;
            }).join('\n');

            participantContent += `### 🏆 상위 참가자 (${Math.min(5, participants.length)}명)\n${participantText}\n\n`;

            if (participants.length > 5) {
                participantContent += `### 📋 전체 순위\n\`/랭킹 이벤트:${event.id}\` 명령어로 전체 순위를 확인하세요\n\n`;
            }

            // Calculate statistics
            const totalScore = participants.reduce((sum, p) => sum + parseFloat(p.total_score), 0);
            const avgScore = totalScore / participants.length;
            const totalEntries = participants.reduce((sum, p) => sum + p.entries_count, 0);

            statsContent = `### 📈 통계\n평균 점수: ${formatScore(avgScore, event.score_type)}\n총 기록 수: ${totalEntries}회`;
        }

        const section = new SectionBuilder()
            .setThumbnailAccessory(
                new ThumbnailBuilder().setURL('https://harmari.duckdns.org/static/alarm.png')
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(headerContent)
            );

        if (participantContent.trim()) {
            section.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(participantContent.trim())
            );
        }

        if (statsContent.trim()) {
            section.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(statsContent)
            );
        }

        const container = new ContainerBuilder()
            .addSectionComponents(section)
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`*<t:${Math.floor(Date.now() / 1000)}:R>*`)
            );

        await interaction.reply({ 
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });

    } catch (error) {
        console.error('Error getting event info:', error);
        await interaction.reply({
            content: '❌ 이벤트 정보를 불러오는 중 오류가 발생했습니다.',
            flags: MessageFlags.Ephemeral
        });
    }
}

function getRankEmoji(rank) {
    switch (rank) {
        case 1: return '🥇';
        case 2: return '🥈';
        case 3: return '🥉';
        default: return '🏅';
    }
}

function formatScore(score, scoreType) {
    const numScore = parseFloat(score);
    switch (scoreType) {
        case 'time_seconds':
            const totalSeconds = Math.round(numScore);
            
            if (totalSeconds < 60) {
                // 60초 미만: 초 단위만 표시
                return `${totalSeconds}초`;
            } else if (totalSeconds < 3600) {
                // 1시간 미만: 분:초 형태로 표시
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                return seconds > 0 ? `${minutes}분 ${seconds}초` : `${minutes}분`;
            } else {
                // 1시간 이상: 시:분:초 형태로 표시
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;
                
                let result = `${hours}시간`;
                if (minutes > 0) {
                    result += ` ${minutes}분`;
                }
                if (seconds > 0) {
                    result += ` ${seconds}초`;
                }
                return result;
            }
        case 'time_minutes':
            const totalMinutes = Math.round(numScore);
            if (totalMinutes < 60) {
                return `${totalMinutes}분`;
            } else {
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                return minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간`;
            }
        case 'points':
        default:
            return `${numScore.toFixed(1)}점`;
    }
}

function getScoreTypeDisplay(scoreType) {
    const types = {
        'points': '📈 포인트',
        'time_seconds': '⏱️ 시간 (초)',
        'time_minutes': '⏰ 시간 (분)'
    };
    return types[scoreType] || types['points'];
}