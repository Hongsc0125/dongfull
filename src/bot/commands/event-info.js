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
import { getLeaderboard } from '../../database/participants.js';

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

        const participants = await getLeaderboard(event.id, 999);

        // 이벤트 생성/점수 추가와 비슷한 스타일로 구성
        let headContent = `## 🎯 ${event.event_name} 이벤트 정보!\n`;
        
        if (event.description) {
            headContent += `### ${event.description}\n`;
        }

        // 집계 방식 표시
        let aggregationDisplay = '';
        switch (event.score_aggregation) {
            case 'average':
                aggregationDisplay = '📊 평균';
                break;
            case 'best':
                aggregationDisplay = '🏆 베스트';
                break;
            case 'sum':
            default:
                aggregationDisplay = '🔢 총합';
                break;
        }

        let bodyContent = `> **상    태:** ${event.is_active ? '✅ 활성' : '❌ 비활성'}\n` +
                         `> **점수타입:** ${getScoreTypeDisplay(event.score_type)}\n` +
                         `> **순위기준:** ${event.sort_direction === 'desc' ? '높은순' : '낮은순'}\n` +
                         `> **집계방식:** ${aggregationDisplay}\n` +
                         `> **참가자수:** ${participants.length}명`;

        // 상위 참가자 정보
        let footerContent = '';
        if (participants.length > 0) {
            const topParticipants = participants.slice(0, 3);
            const participantText = topParticipants.map((participant, index) => {
                const rankEmoji = getRankEmoji(index + 1);
                // 순위와 동일한 계산된 점수 사용
                const displayScore = participant.calculated_score !== undefined ? 
                    participant.calculated_score : participant.total_score;
                const score = formatScore(displayScore, event.score_type);
                return `${rankEmoji} ${participant.display_name} - ${score}`;
            }).join('\n');

            footerContent = `🏆 **상위 참가자:**\n${participantText}`;
            
            if (participants.length > 3) {
                footerContent += `\n\n📋 전체 순위는 \`/순위 이벤트:${event.event_name}\` 명령어로 확인하세요`;
            }
        } else {
            footerContent = '👥 아직 참가자가 없습니다';
        }

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(headContent)
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(bodyContent)
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(footerContent)
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`*EVENT_ID: ${event.id} • <t:${Math.floor(new Date(event.created_at).getTime() / 1000)}:R> 생성*`)
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